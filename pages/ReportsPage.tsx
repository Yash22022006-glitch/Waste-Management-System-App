import React, { useState, useEffect, useCallback } from 'react';
import ReportForm from '../components/ReportForm';
import { reportService } from '../services/reportService';
import { Report, ReportStatus, Bin, UserRole } from '../types';
import { binService } from '../services/binService';
import { useAuth } from '../hooks/useAuth';
import { geminiService } from '../services/geminiService';

const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [bins, setBins] = useState<Bin[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [summarizingReportId, setSummarizingReportId] = useState<string | null>(null);

  const { user, isAdmin } = useAuth();

  const fetchReportsAndBins = useCallback(() => {
    setReports(reportService.getReports());
    setBins(binService.getBins());
  }, []);

  useEffect(() => {
    fetchReportsAndBins();
    reportService.subscribe(setReports);
    // Correctly capture and use the unsubscribe function for binService
    const unsubscribeBins = binService.subscribe(setBins);
    return () => {
      reportService.unsubscribe(setReports);
      unsubscribeBins(); // Call the captured unsubscribe function
    };
  }, [fetchReportsAndBins]);

  // Updated handleSubmitReport to accept imageUrl
  const handleSubmitReport = useCallback(async (issue: string, binId?: string, location?: { lat: number; lng: number }, imageUrl?: string) => {
    if (!user) {
      setSubmitError('You must be logged in to submit a report.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      reportService.addReport(user.id, issue, binId, location, imageUrl); // Pass imageUrl to service
      setSubmitSuccess(true);
      // Automatically clear success message after a few seconds
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (err: unknown) {
      setSubmitError('Failed to submit report. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }, [user]);

  const handleUpdateReportStatus = useCallback((reportId: string, status: ReportStatus, assignedTo?: string) => {
    reportService.updateReportStatus(reportId, status, assignedTo);
  }, []);

  const handleSummarizeReport = useCallback(async (report: Report) => {
    if (!isAdmin) return;

    setSummarizingReportId(report.id);
    try {
      const summary = await geminiService.summarizeReport(report.issue);
      reportService.updateReportSummary(report.id, summary);
    } catch (error) {
      console.error("Error summarizing report:", error);
      // Optionally display an error for this specific summary action
    } finally {
      setSummarizingReportId(null);
    }
  }, [isAdmin]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Reports</h2>

      {/* The ReportForm in ReportsPage is now the primary place for Community Members to submit reports */}
      {user?.role === UserRole.COMMUNITY_MEMBER && (
        <div className="mb-8 p-4 bg-white rounded-lg shadow-md">
          <ReportForm
            bins={bins}
            onSubmit={handleSubmitReport}
            isLoading={isSubmitting}
            error={submitError}
            success={submitSuccess}
          />
        </div>
      )}

      <h3 className="text-2xl font-bold text-gray-800 mb-4 mt-8">All Submitted Reports</h3>
      <div className="space-y-4">
        {reports.length === 0 ? (
          <p className="text-gray-600">No reports submitted yet.</p>
        ) : (
          reports.map((report) => (
            <div key={report.id} className="bg-white p-5 rounded-lg shadow-md border-l-4 border-info">
              <div className="flex justify-between items-start flex-wrap"> {/* Added flex-wrap */}
                <div className="flex-grow">
                  <p className="text-lg font-semibold text-gray-800">Issue: {report.issue}</p>
                  <p className="text-sm text-gray-600">Submitted by: {report.userId}</p>
                  {report.binId && (
                    <p className="text-sm text-gray-600">Related Bin: {bins.find(b => b.id === report.binId)?.serialNumber || report.binId}</p>
                  )}
                  {report.location && (
                    <p className="text-sm text-gray-600">Location: Lat {report.location.lat.toFixed(4)}, Lng {report.location.lng.toFixed(4)}</p>
                  )}
                  <p className="text-sm text-gray-600">Status: <span className={`font-medium ${
                    report.status === ReportStatus.PENDING ? 'text-warning' :
                    report.status === ReportStatus.IN_PROGRESS ? 'text-primary-600' :
                    report.status === ReportStatus.RESOLVED ? 'text-success' : 'text-danger'
                  }`}>{report.status.toUpperCase()}</span></p>
                  <p className="text-xs text-gray-500">Submitted At: {new Date(report.submittedAt).toLocaleString()}</p>
                  {report.resolvedAt && (
                    <p className="text-xs text-gray-500">Resolved At: {new Date(report.resolvedAt).toLocaleString()}</p>
                  )}
                  {report.assignedTo && (
                    <p className="text-xs text-gray-500">Assigned To: {report.assignedTo}</p>
                  )}
                </div>
                {report.imageUrl && (
                  <div className="w-full sm:w-48 sm:ml-4 mt-4 sm:mt-0 flex-shrink-0"> {/* Adjusted image container */}
                    <img src={report.imageUrl} alt="Report attachment" className="rounded-md object-cover w-full h-auto max-h-48" />
                    <p className="text-xs text-gray-500 text-center mt-1">Attached Photo</p>
                  </div>
                )}
              </div>

              {isAdmin && (
                <>
                  <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-200">
                    {report.status !== ReportStatus.RESOLVED && (
                      <button
                        onClick={() => handleUpdateReportStatus(report.id, ReportStatus.RESOLVED, user?.id)}
                        className="px-3 py-1 bg-success text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
                      >
                        Resolve
                      </button>
                    )}
                    {report.status === ReportStatus.PENDING && (
                      <button
                        onClick={() => handleUpdateReportStatus(report.id, ReportStatus.IN_PROGRESS, user?.id)}
                        className="px-3 py-1 bg-primary-500 text-white text-sm rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
                      >
                        Assign
                      </button>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-700 mb-2">AI Summary:</h4>
                    {report.summary ? (
                      <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-md italic">{report.summary}</p>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleSummarizeReport(report)}
                          disabled={summarizingReportId === report.id}
                          className="px-3 py-1 bg-info text-white text-sm rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {summarizingReportId === report.id ? (
                            <svg className="animate-spin h-4 w-4 text-white inline mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          ) : 'Summarize with AI'}
                        </button>
                        {!report.summary && <p className="text-sm text-gray-500">No summary available. Click to generate.</p>}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReportsPage;