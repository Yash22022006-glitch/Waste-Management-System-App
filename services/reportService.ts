import { Report, ReportStatus } from '../types';
import { notificationService } from './notificationService';

class ReportService {
  private reports: Report[] = [];
  private listeners: Set<(reports: Report[]) => void> = new Set();

  public getReports(): Report[] {
    return [...this.reports];
  }

  public getReportById(id: string): Report | undefined {
    return this.reports.find(r => r.id === id);
  }

  public addReport(
    userId: string,
    issue: string,
    binId?: string,
    location?: { lat: number; lng: number },
    imageUrl?: string, // New parameter for image
  ): Report {
    const newReport: Report = {
      id: `report-${Date.now()}`,
      userId,
      binId,
      location,
      issue,
      status: ReportStatus.PENDING,
      submittedAt: new Date().toISOString(),
      imageUrl, // Store the image URL
    };
    this.reports = [newReport, ...this.reports]; // Add to top
    notificationService.addReportNotification(newReport.id, newReport.issue);
    this.notifyListeners();
    return newReport;
  }

  public updateReportStatus(reportId: string, status: ReportStatus, assignedTo?: string) {
    const index = this.reports.findIndex(r => r.id === reportId);
    if (index > -1) {
      this.reports[index] = {
        ...this.reports[index],
        status: status,
        assignedTo: assignedTo || this.reports[index].assignedTo,
        resolvedAt: status === ReportStatus.RESOLVED ? new Date().toISOString() : undefined,
      };
      this.notifyListeners();
      return this.reports[index];
    }
    return undefined;
  }

  public updateReportSummary(reportId: string, summary: string) {
    const index = this.reports.findIndex(r => r.id === reportId);
    if (index > -1) {
      this.reports[index] = {
        ...this.reports[index],
        summary: summary,
      };
      this.notifyListeners();
      return this.reports[index];
    }
    return undefined;
  }

  public subscribe(listener: (reports: Report[]) => void) {
    this.listeners.add(listener);
    listener(this.getReports());
  }

  public unsubscribe(listener: (reports: Report[]) => void) {
    this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.getReports()));
  }
}

export const reportService = new ReportService();