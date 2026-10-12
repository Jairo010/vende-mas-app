import { useMutation } from '@tanstack/react-query';
import { taskApiService } from '@/infrastructure/api/services/task-api.service';
import type { ITaskRepositoryPort, UploadPhotoResult } from '@/core/ports/task.repository.port';

export interface UploadPhotoVariables {
  file: {
    uri: string;
    name: string;
    type: string;
  };
}

export function useUploadTaskPhoto(repository: ITaskRepositoryPort = taskApiService) {
  return useMutation<UploadPhotoResult, Error, UploadPhotoVariables>({
    mutationFn: ({ file }) => repository.uploadPhoto(file),
  });
}
