export interface Item {
  id: string;
  name: string;
  warrantyEndDate: string | Date | null;
  hasReceipt: boolean;
  homeId: string;
}

export interface MaintenanceLog {
  id: string;
  itemId: string;
  date: string | Date;
}

export interface Insight {
  type: 'WARNING' | 'INFO' | 'SUCCESS';
  message: string;
  itemId: string;
}

export interface HealthReport {
  score: number;
  insights: Insight[];
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export function generateHomeHealthReport(items: Item[], logs: MaintenanceLog[]): HealthReport {
  if (items.length === 0) return { score: 100, insights: [{ type: 'INFO', message: 'Add your first item to get a health score.', itemId: 'all' }] };

  let totalScore = 0;
  const insights: Insight[] = [];
  const now = new Date().getTime();

  items.forEach(item => {
    let itemScore = 0;

    // 1. Warranty Check (40 points)
    if (item.warrantyEndDate) {
      const warrantyEnd = new Date(item.warrantyEndDate).getTime();
      const timeRemaining = warrantyEnd - now;

      if (timeRemaining > THIRTY_DAYS_MS) {
        itemScore += 40;
      } else if (timeRemaining > 0) {
        itemScore += 20; // Expiring soon
        insights.push({ type: 'WARNING', message: `Warranty for ${item.name} is expiring soon!`, itemId: item.id });
      } else {
        insights.push({ type: 'INFO', message: `Warranty for ${item.name} has expired.`, itemId: item.id });
      }
    } else {
      insights.push({ type: 'INFO', message: `No warranty tracked for ${item.name}.`, itemId: item.id });
    }

    // 2. Maintenance Check (40 points)
    const itemLogs = logs.filter(log => log.itemId === item.id);
    if (itemLogs.length > 0) {
      // Sort to get the latest
      itemLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const lastMaintenance = new Date(itemLogs[0].date).getTime();

      if (now - lastMaintenance < ONE_YEAR_MS) {
        itemScore += 40;
      } else {
        insights.push({ type: 'WARNING', message: `${item.name} hasn't been serviced in over a year.`, itemId: item.id });
      }
    } else {
      insights.push({ type: 'WARNING', message: `${item.name} has no maintenance records.`, itemId: item.id });
    }

    // 3. Documentation Check (20 points)
    if (item.hasReceipt) {
      itemScore += 20;
    } else {
      insights.push({ type: 'INFO', message: `Upload a receipt for ${item.name} to complete its profile.`, itemId: item.id });
    }

    totalScore += itemScore;
  });

  const finalScore = Math.round(totalScore / items.length);

  return {
    score: finalScore,
    insights: sortInsights(insights)
  };
}

// פונקציית עזר למיון התובנות
function sortInsights(insights: Insight[]): Insight[] {
  const priority = { 'WARNING': 1, 'INFO': 2, 'SUCCESS': 3 };
  return insights.sort((a, b) => priority[a.type] - priority[b.type]);
}
