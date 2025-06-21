export enum MicroserviceEvents {
  EMAIL_GENERATED = "Event.EmailGenerated",
  EMAIL_SENT = "Event.EmailSent",
  EMAIL_SENDING_FAILED = "Event.EmailSendingFailed",
}

export type EmailEvent<TData = any> = {
  email: {
    _id: string;
    campaignId?: string;
  };
  data?: TData;
};

export type EmailGeneratedEvent = EmailEvent;

export type EmailSentEvent = EmailEvent;
