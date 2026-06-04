import { useLimsState } from "./use-lims-state";
import { SampleStatus, Priority } from "../types";

export function useSampleActions() {
  const {
    registerSample: rawRegisterSample,
    verifySample,
    rejectSample,
    assignStorageLocation,
    uploadSampleAttachment,
  } = useLimsState();

  const register = async (sampleData: {
    client: string;
    project: string;
    type: string;
    weight: string;
    priority: Priority;
    location: string;
    matrix?: string;
    container?: string;
    receivedFrom?: string;
    specialInstructions?: string;
  }) => {
    return rawRegisterSample(sampleData);
  };

  const verify = async (sampleId: string, notes: string, storageLocation: string) => {
    return verifySample(sampleId, notes, storageLocation);
  };

  const reject = async (sampleId: string, reason: string) => {
    return rejectSample(sampleId, reason);
  };

  const assignStorage = async (sampleId: string, location: string) => {
    return assignStorageLocation(sampleId, location);
  };

  const uploadAttachment = async (sampleId: string, file: File) => {
    return uploadSampleAttachment(sampleId, file);
  };

  return {
    register,
    verify,
    reject,
    assignStorage,
    uploadAttachment,
  };
}
