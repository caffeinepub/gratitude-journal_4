import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { JournalEntry, UserProfile, ExternalBlob, Theme } from '../backend';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

export function useSetThemePreference() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (theme: Theme) => {
      if (!actor) throw new Error('Actor not available');
      return actor.setThemePreference(theme);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Journal Entry Queries
export function useGetUserEntries() {
  const { actor, isFetching } = useActor();

  return useQuery<JournalEntry[]>({
    queryKey: ['userEntries'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getUserEntries();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (text: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createEntry(text);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userEntries'] });
    },
  });
}

export function useCreateEntryWithImages() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ text, images }: { text: string; images: ExternalBlob[] }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createEntryWithImages(text, images);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userEntries'] });
    },
  });
}

export function useUpdateEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateEntry(id, text);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userEntries'] });
    },
  });
}

export function useDeleteEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteEntry(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userEntries'] });
    },
  });
}

export function useAddImagesToEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, images }: { id: string; images: ExternalBlob[] }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addImagesToEntry(id, images);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userEntries'] });
    },
  });
}

export function useRemovePhotoFromEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entryId, photoBlob }: { entryId: string; photoBlob: ExternalBlob }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removePhotoFromEntry(entryId, photoBlob);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userEntries'] });
    },
  });
}
