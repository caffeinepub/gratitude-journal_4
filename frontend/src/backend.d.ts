import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface JournalEntry {
    id: string;
    text: string;
    user: Principal;
    timestamp: bigint;
    images: Array<ExternalBlob>;
}
export interface UserProfile {
    name: string;
    themePreference: Theme;
}
export enum Theme {
    dark = "dark",
    light = "light",
    systemPreferred = "systemPreferred"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addImagesToEntry(id: string, newImages: Array<ExternalBlob>): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createEntry(text: string): Promise<string>;
    createEntryWithImages(text: string, images: Array<ExternalBlob>): Promise<string>;
    deleteEntry(id: string): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getEntriesForUser(user: Principal): Promise<Array<JournalEntry>>;
    getThemePreference(): Promise<Theme>;
    getUserEntries(): Promise<Array<JournalEntry>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    removePhotoFromEntry(entryId: string, photoBlob: ExternalBlob): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setThemePreference(theme: Theme): Promise<void>;
    updateEntry(id: string, newText: string): Promise<void>;
}
