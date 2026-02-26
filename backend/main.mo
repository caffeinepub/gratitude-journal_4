import Map "mo:core/Map";
import Array "mo:core/Array";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Text "mo:core/Text";



actor {
  // Include authorization and storage mixins
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  public type Theme = {
    #systemPreferred;
    #dark;
    #light;
  };

  public type UserProfile = {
    name : Text;
    themePreference : Theme;
  };

  type JournalEntry = {
    id : Text;
    user : Principal;
    text : Text;
    images : [Storage.ExternalBlob];
    timestamp : Int;
  };

  let entries = Map.empty<Text, JournalEntry>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // User profile management functions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Theme preference management (add to user profile)
  public shared ({ caller }) func setThemePreference(theme : Theme) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save theme preferences");
    };
    let currentProfile = switch (userProfiles.get(caller)) {
      case (null) { { name = "User"; themePreference = #systemPreferred } };
      case (?profile) { profile };
    };
    let updatedProfile = { currentProfile with themePreference = theme };
    userProfiles.add(caller, updatedProfile);
  };

  public query ({ caller }) func getThemePreference() : async Theme {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can fetch theme preferences");
    };
    switch (userProfiles.get(caller)) {
      case (null) { #systemPreferred };
      case (?profile) { profile.themePreference };
    };
  };

  // Create a new journal entry
  public shared ({ caller }) func createEntry(text : Text) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create entries");
    };

    let timestamp = Time.now();
    let id = caller.toText() # "-" # Int.toText(timestamp);

    let entry : JournalEntry = {
      id;
      user = caller;
      text;
      images = [];
      timestamp;
    };

    entries.add(id, entry);
    id;
  };

  // Create a new journal entry with images
  public shared ({ caller }) func createEntryWithImages(text : Text, images : [Storage.ExternalBlob]) : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create entries");
    };

    let timestamp = Time.now();
    let id = caller.toText() # "-" # Int.toText(timestamp);

    let entry : JournalEntry = {
      id;
      user = caller;
      text;
      images;
      timestamp;
    };

    entries.add(id, entry);
    id;
  };

  // Get all entries for the authenticated user
  public query ({ caller }) func getUserEntries() : async [JournalEntry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view entries");
    };

    entries.values().filter(func(entry : JournalEntry) : Bool { entry.user == caller }).toArray();
  };

  // Get all entries for a specific user
  public query ({ caller }) func getEntriesForUser(user : Principal) : async [JournalEntry] {
    // No permission check needed, but only admins can view other users' entries
    if (caller != user and not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Can only view your own entries");
    };

    entries.values().filter(func(entry : JournalEntry) : Bool { entry.user == user }).toArray();
  };

  // Update an existing entry
  public shared ({ caller }) func updateEntry(id : Text, newText : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update entries");
    };

    switch (entries.get(id)) {
      case (null) { Runtime.trap("Entry not found") };
      case (?existingEntry) {
        if (existingEntry.user != caller) {
          Runtime.trap("Unauthorized: Cannot update another user's entry");
        };

        let updatedEntry = {
          existingEntry with
          text = newText;
        };

        entries.add(id, updatedEntry);
      };
    };
  };

  // Delete an entry
  public shared ({ caller }) func deleteEntry(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete entries");
    };

    switch (entries.get(id)) {
      case (null) { Runtime.trap("Entry not found") };
      case (?existingEntry) {
        if (existingEntry.user != caller) {
          Runtime.trap("Unauthorized: Cannot delete another user's entry");
        };

        entries.remove(id);
      };
    };
  };

  // Upload images and associate with entry
  public shared ({ caller }) func addImagesToEntry(id : Text, newImages : [Storage.ExternalBlob]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add images");
    };

    switch (entries.get(id)) {
      case (null) { Runtime.trap("Entry not found") };
      case (?existingEntry) {
        if (existingEntry.user != caller) {
          Runtime.trap("Unauthorized: Cannot add images to another user's entry");
        };

        let updatedEntry = {
          existingEntry with
          images = existingEntry.images.concat(newImages);
        };

        entries.add(id, updatedEntry);
      };
    };
  };

  // Remove individual photo from entry
  public shared ({ caller }) func removePhotoFromEntry(entryId : Text, photoBlob : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can remove photos");
    };

    switch (entries.get(entryId)) {
      case (null) { Runtime.trap("Entry not found") };
      case (?existingEntry) {
        if (existingEntry.user != caller) {
          Runtime.trap("Unauthorized: Cannot modify another user's entry");
        };

        // Filter out the photo to remove using direct blob comparison
        let newImages = existingEntry.images.filter(
          func(image) {
            not isBlobEqual(image, photoBlob);
          }
        );

        // Save updated entry
        let updatedEntry = {
          existingEntry with
          images = newImages;
        };
        entries.add(entryId, updatedEntry);
      };
    };
  };

  func isBlobEqual(blob1 : Storage.ExternalBlob, blob2 : Storage.ExternalBlob) : Bool {
    blob1 == blob2;
  };
};
