import { Injectable, Logger } from '@nestjs/common';
import { calendar_v3, google } from 'googleapis';
import { randomUUID } from 'crypto';

export type CreateGoogleMeetInput = {
  summary: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  attendees?: string[];
};

export type GoogleMeetResult = {
  meetingLink: string;
  meetingId: string;
  calendarEventId: string;
};

@Injectable()
export class GoogleMeetService {
  private readonly logger = new Logger(GoogleMeetService.name);
  private readonly calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';
  private readonly authClient = this.createAuthClient();

  private createAuthClient() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (clientId && clientSecret && refreshToken) {
      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        process.env.GOOGLE_REDIRECT_URI,
      );

      oauth2Client.setCredentials({ refresh_token: refreshToken });
      return oauth2Client;
    }

    return null;
  }

  hasGoogleAuth() {
    return Boolean(this.authClient);
  }

  private getMeetLink(event: calendar_v3.Schema$Event) {
    return (
      event.hangoutLink ||
      event.conferenceData?.entryPoints?.find(
        (entryPoint) => entryPoint.entryPointType === 'video',
      )?.uri ||
      null
    );
  }

  async createMeeting(
    input: CreateGoogleMeetInput,
  ): Promise<GoogleMeetResult | null> {
    if (!this.authClient) {
      this.logger.warn(
        'Google Meet is not configured. Returning null and letting the caller use a fallback link.',
      );
      return null;
    }

    const calendar = google.calendar({ version: 'v3', auth: this.authClient });

    const response = await calendar.events.insert({
      calendarId: this.calendarId,
      conferenceDataVersion: 1,
      sendUpdates: 'all',
      requestBody: {
        summary: input.summary,
        description: input.description,
        start: { dateTime: input.startTime.toISOString() },
        end: { dateTime: input.endTime.toISOString() },
        attendees: input.attendees?.map((email) => ({ email })),
        conferenceData: {
          createRequest: {
            requestId: randomUUID(),
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
      },
    });

    const event = response.data;
    const meetingLink = this.getMeetLink(event);
    const meetingId =
      event.conferenceData?.conferenceId || event.id || randomUUID();

    if (!meetingLink) {
      throw new Error(
        'Google Meet event created but no meeting link was returned.',
      );
    }

    return {
      meetingLink,
      meetingId,
      calendarEventId: event.id || meetingId,
    };
  }

  async updateMeeting(
    calendarEventId: string,
    input: Partial<CreateGoogleMeetInput>,
  ): Promise<GoogleMeetResult | null> {
    if (!this.authClient) {
      return null;
    }

    const calendar = google.calendar({ version: 'v3', auth: this.authClient });

    const response = await calendar.events.patch({
      calendarId: this.calendarId,
      eventId: calendarEventId,
      conferenceDataVersion: 1,
      sendUpdates: 'all',
      requestBody: {
        summary: input.summary,
        description: input.description,
        start: input.startTime
          ? { dateTime: input.startTime.toISOString() }
          : undefined,
        end: input.endTime
          ? { dateTime: input.endTime.toISOString() }
          : undefined,
        attendees: input.attendees?.map((email) => ({ email })),
      },
    });

    const event = response.data;
    const meetingLink = this.getMeetLink(event);

    if (!meetingLink) {
      throw new Error(
        'Google Meet event updated but no meeting link was returned.',
      );
    }

    return {
      meetingLink,
      meetingId:
        event.conferenceData?.conferenceId || event.id || calendarEventId,
      calendarEventId: event.id || calendarEventId,
    };
  }

  async cancelMeeting(calendarEventId: string) {
    if (!this.authClient) {
      return;
    }

    const calendar = google.calendar({ version: 'v3', auth: this.authClient });

    await calendar.events.delete({
      calendarId: this.calendarId,
      eventId: calendarEventId,
      sendUpdates: 'all',
    });
  }
}
