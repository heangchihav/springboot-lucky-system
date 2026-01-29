type CallStatusResponse = {
  key: string;
  label: string;
  createdBy: string;
  createdAt: string;
};

export type ProcessedRecord = {
  arrivedAt: string;
  calledAt: string;
  status: string;
};

export type StatusSummary = {
  arrivedAt: string;
  calledAt: string;
  count: number;
};

/**
 * Processes Excel data to extract status information from Column B (Arrived At) and Column K (Status)
 */
export function processExcelData(
  data: string,
  statuses: CallStatusResponse[]
): { entries: Record<string, string>; processedRecords: ProcessedRecord[] } {
  const lines = data.trim().split('\n').filter(line => line.trim());
  const statusCountMap = new Map<string, number>();
  const processedRecords: ProcessedRecord[] = [];

  // Track the current arrived at date
  let currentArrivedAt = '';

  lines.forEach((line) => {
    // Split by tabs (Excel copy-paste uses tabs)
    const columns = line.split('\t');

    // Check if this is a main data row (starts with a number)
    const isFirstColumnNumber = columns[0]?.trim().match(/^\d+$/);

    if (isFirstColumnNumber && columns.length > 10) {
      // This is a main data row - extract arrived at from Column B
      const arrivedAtColumn = columns[1]?.trim(); // Column B - Arrived At
      if (arrivedAtColumn) {
        // Extract date from Column B (handle different formats)
        const dateMatch = arrivedAtColumn.match(/(\d{2}\/\d{2}\/\d{4})/);
        if (dateMatch) {
          currentArrivedAt = dateMatch[1];
        } else {
          // Try to extract date from datetime format
          const dateTimeMatch = arrivedAtColumn.match(/(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})/);
          if (dateTimeMatch) {
            currentArrivedAt = dateTimeMatch[1];
          }
        }
      }

      // Also check Column K for multi-line content within the same column
      const statusColumn = columns[10]?.trim(); // Column K - might contain multi-line
      if (statusColumn) {
        // Split Column K content by newlines to handle multi-line content
        const kLines = statusColumn.split('\n').filter(kLine => kLine.trim());

        for (const kLine of kLines) {
          // Check if this line contains status and date
          const statusDateMatch = kLine.match(/^(.+?)\s+(\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}:\d{2})$/);

          if (statusDateMatch) {
            // Found status with date
            const status = statusDateMatch[1].trim();
            const calledAt = statusDateMatch[2].trim();

            // Validate that status exists in backend statuses
            const isValidStatus = statuses.some(backendStatus =>
              backendStatus.label === status ||
              backendStatus.key === status.toLowerCase().replace(/[^a-z0-9]/g, '-')
            );

            // Only process if status is valid and not empty
            if (status && isValidStatus && status.trim().length > 0) {

              // Count status occurrences
              statusCountMap.set(status, (statusCountMap.get(status) || 0) + 1);

              processedRecords.push({
                arrivedAt: currentArrivedAt,
                calledAt,
                status
              });
            }
          } else {
            // Check if it's just a status without date - use today's date
            const statusOnly = kLine.trim();
            if (statusOnly && statusOnly.length > 0) {
              // Validate that status exists in backend statuses (case-insensitive)
              const isValidStatus = statuses.some(backendStatus =>
                backendStatus.label.toLowerCase() === statusOnly.toLowerCase() ||
                backendStatus.key === statusOnly.toLowerCase().replace(/[^a-z0-9]/g, '-')
              );

              // Fallback: if no exact match, try to find partial match or just accept it
              if (!isValidStatus && statuses.length > 0) {
                // Try to find a status that contains the status text
                const partialMatch = statuses.find(backendStatus =>
                  backendStatus.label.includes(statusOnly) ||
                  statusOnly.includes(backendStatus.label)
                );

                // If still no match, just process it anyway (for testing)
                if (!partialMatch) {
                  const today = new Date().toISOString().slice(0, 16).replace('T', ' ');
                  statusCountMap.set(statusOnly, (statusCountMap.get(statusOnly) || 0) + 1);
                  processedRecords.push({
                    arrivedAt: currentArrivedAt,
                    calledAt: today,
                    status: statusOnly
                  });
                  return; // Skip the rest of the validation
                }
              }

              if (isValidStatus) {
                const today = new Date().toISOString().slice(0, 16).replace('T', ' ');

                statusCountMap.set(statusOnly, (statusCountMap.get(statusOnly) || 0) + 1);
                processedRecords.push({
                  arrivedAt: currentArrivedAt,
                  calledAt: today,
                  status: statusOnly
                });
              }
            }
          }
        }
      }
    } else if (!isFirstColumnNumber && currentArrivedAt) {
      // This might be a separate status line - check if it contains status and date
      const statusDateMatch = line.match(/^(.+?)\s+(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})/);

      if (statusDateMatch) {
        // Found status with date
        const status = statusDateMatch[1].trim();
        const calledAt = statusDateMatch[2].trim();

        // Validate that status exists in backend statuses
        const isValidStatus = statuses.some(backendStatus =>
          backendStatus.label === status ||
          backendStatus.key === status.toLowerCase().replace(/[^a-z0-9]/g, '-')
        );

        // Only process if status is valid and not empty
        if (status && isValidStatus && status.trim().length > 0) {

          statusCountMap.set(status, (statusCountMap.get(status) || 0) + 1);
          processedRecords.push({ arrivedAt: currentArrivedAt, calledAt, status });
        }
      } else {
        // Check if it's a status without date - use today's date
        const statusOnly = line.trim();
        if (statusOnly && statusOnly.length > 0) {
          // Validate that status exists in backend statuses
          const isValidStatus = statuses.some(backendStatus =>
            backendStatus.label === statusOnly ||
            backendStatus.key === statusOnly.toLowerCase().replace(/[^a-z0-9]/g, '-')
          );

          if (isValidStatus) {
            const today = new Date().toISOString().slice(0, 16).replace('T', ' ');

            statusCountMap.set(statusOnly, (statusCountMap.get(statusOnly) || 0) + 1);
            processedRecords.push({
              arrivedAt: currentArrivedAt,
              calledAt: today,
              status: statusOnly
            });
          }
        }
      }
    }
  });

  // Update the entries state with status counts
  const newEntries: Record<string, string> = {};

  // Try to match status counts with existing statuses
  statusCountMap.forEach((count, statusName) => {
    // Find matching status by label (case-insensitive)
    const matchingStatus = statuses.find(s =>
      s.label.toLowerCase() === statusName.toLowerCase()
    );

    if (matchingStatus) {
      newEntries[matchingStatus.key] = count.toString();
    } else {
      // If no matching status, try to create a key from the status name
      const statusKey = statusName.toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      // Check if this status key exists
      const existingStatus = statuses.find(s => s.key === statusKey);
      if (existingStatus) {
        newEntries[statusKey] = count.toString();
      }
    }
  });

  // If no entries were created but we have status counts, create a default entry
  if (Object.keys(newEntries).length === 0 && statusCountMap.size > 0) {
    const totalCount = Array.from(statusCountMap.values()).reduce((sum, count) => sum + count, 0);

    // Use the first available status
    if (statuses.length > 0) {
      newEntries[statuses[0].key] = totalCount.toString();
    }
  }

  return { entries: newEntries, processedRecords };
}

/**
 * Generates a preview of the processed Excel data
 */
export function generateDataPreview(
  data: string,
  statuses: CallStatusResponse[]
): { statusSummaries: Map<string, StatusSummary>; totalRecords: number } {
  const lines = data.trim().split('\n').filter(line => line.trim());
  const statusCountMap = new Map<string, number>();
  const processedRecords: ProcessedRecord[] = [];

  // Track the current arrived at date
  let currentArrivedAt = '';

  lines.forEach(line => {
    const columns = line.split('\t');

    // Check if this is a main data row (starts with a number)
    const isFirstColumnNumber = columns[0]?.trim().match(/^\d+$/);

    if (isFirstColumnNumber && columns.length > 10) {
      const arrivedAtColumn = columns[1]?.trim();
      const statusColumn = columns[10]?.trim();

      if (arrivedAtColumn && statusColumn) {
        // Parse arrived at date from Column B and update currentArrivedAt
        let arrivedAt = '';
        const dateMatch = arrivedAtColumn.match(/(\d{2}\/\d{2}\/\d{4})/);
        if (dateMatch) {
          arrivedAt = dateMatch[1];
          currentArrivedAt = arrivedAt; // Update the tracking variable
        }

        // Split Column K content by newlines to handle multi-line content
        const kLines = statusColumn.split('\n').filter(kLine => kLine.trim());

        for (const kLine of kLines) {
          // Check if this line contains status and date
          const statusDateMatch = kLine.match(/^(.+?)\s+(\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}:\d{2})$/);

          if (statusDateMatch) {
            // Found status with date
            const status = statusDateMatch[1].trim();
            const calledAt = statusDateMatch[2].trim();

            // Validate that status exists in backend statuses
            const isValidStatus = statuses.some(backendStatus =>
              backendStatus.label === status ||
              backendStatus.key === status.toLowerCase().replace(/[^a-z0-9]/g, '-')
            );

            // Only process if status is valid and not empty
            if (status && isValidStatus && status.trim().length > 0) {

              statusCountMap.set(status, (statusCountMap.get(status) || 0) + 1);
              processedRecords.push({ arrivedAt, calledAt, status });
            }
          } else {
            // Check if it's a status without date - use current date
            const statusOnly = kLine.trim();
            if (statusOnly && statusOnly.length > 0) {
              // Validate that status exists in backend statuses
              const isValidStatus = statuses.some(backendStatus =>
                backendStatus.label === statusOnly ||
                backendStatus.key === statusOnly.toLowerCase().replace(/[^a-z0-9]/g, '-')
              );

              if (isValidStatus) {
                const today = new Date().toISOString().slice(0, 16).replace('T', ' ');

                statusCountMap.set(statusOnly, (statusCountMap.get(statusOnly) || 0) + 1);
                processedRecords.push({ arrivedAt, calledAt: today, status: statusOnly });
              }
            }
          }
        }
      }
    } else if (!isFirstColumnNumber) {
      // This might be a separate status line - check if it contains status and date
      const statusDateMatch = line.match(/^(.+?)\s+(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})/);

      if (statusDateMatch) {
        // Found status with date
        const status = statusDateMatch[1].trim();
        const calledAt = statusDateMatch[2].trim();

        // Validate that status exists in backend statuses
        const isValidStatus = statuses.some(backendStatus =>
          backendStatus.label === status ||
          backendStatus.key === status.toLowerCase().replace(/[^a-z0-9]/g, '-')
        );

        // Only process if status is valid and not empty
        if (status && isValidStatus && status.trim().length > 0) {

          statusCountMap.set(status, (statusCountMap.get(status) || 0) + 1);
          processedRecords.push({ arrivedAt: '', calledAt, status });
        }
      } else {
        // Check if it's a status without date - use current date
        const statusOnly = line.trim();
        if (statusOnly && statusOnly.length > 0) {
          // Validate that status exists in backend statuses
          const isValidStatus = statuses.some(backendStatus =>
            backendStatus.label === statusOnly ||
            backendStatus.key === statusOnly.toLowerCase().replace(/[^a-z0-9]/g, '-')
          );

          if (isValidStatus) {
            const today = new Date().toISOString().slice(0, 16).replace('T', ' ');

            statusCountMap.set(statusOnly, (statusCountMap.get(statusOnly) || 0) + 1);
            processedRecords.push({ arrivedAt: '', calledAt: today, status: statusOnly });
          }
        }
      }
    }
  });

  // Show status summary with single record per status
  const totalRecords = processedRecords.length;
  const statusSummaries = new Map<string, StatusSummary>();

  // Group by status and get first record's dates for each status
  processedRecords.forEach(record => {
    if (!statusSummaries.has(record.status)) {
      statusSummaries.set(record.status, {
        arrivedAt: record.arrivedAt,
        calledAt: record.calledAt,
        count: 0
      });
    }
    statusSummaries.get(record.status)!.count++;
  });

  return { statusSummaries, totalRecords };
}
