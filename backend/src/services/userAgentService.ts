import { UserAgentRepository, UserAgentFilters, PaginationOptions, UserAgentRecord } from '../database/repositories/userAgentRepository.js';

export class UserAgentService {
  private uaRepo: UserAgentRepository;

  constructor() {
    this.uaRepo = new UserAgentRepository();
  }

  async search(filters: UserAgentFilters, pagination: PaginationOptions) {
    return this.uaRepo.searchUserAgents(filters, pagination);
  }

  async getById(id: number) {
    return this.uaRepo.findById(id);
  }

  async exportRecords(
    filters: UserAgentFilters,
    format: 'json' | 'csv' | 'txt',
    limit: number = 500
  ): Promise<{ data: string; contentType: string; filename: string }> {
    const { records } = await this.uaRepo.searchUserAgents(filters, { page: 1, limit });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // Zero-duplicate guarantee: if clientId provided, mark exported records as served
    if (filters.clientId && records.length > 0) {
      await this.uaRepo.markRecordsAsServed(
        filters.clientId,
        records.map((r: UserAgentRecord) => r.id)
      );
    }

    if (format === 'txt') {
      const textData = records.map((r: UserAgentRecord) => r.user_agent).join('\n');
      return {
        data: textData,
        contentType: 'text/plain; charset=utf-8',
        filename: `uaforge-export-${timestamp}.txt`,
      };
    }

    if (format === 'csv') {
      const header = 'id,user_agent,browser,browser_version,os,os_version,device_type,country_code,country_name,confidence_score,sources\n';
      const rows = records.map((r: UserAgentRecord) => {
        const escapedUa = `"${r.user_agent.replace(/"/g, '""')}"`;
        const sources = `"${(r.sources || []).join(';')}"`;
        return `${r.id},${escapedUa},${r.browser || ''},${r.browser_version || ''},${r.operating_system || ''},${r.operating_system_version || ''},${r.device_type || ''},${r.country_code || 'US'},${r.country_name || 'United States'},${r.confidence_score},${sources}`;
      });
      return {
        data: header + rows.join('\n'),
        contentType: 'text/csv; charset=utf-8',
        filename: `uaforge-export-${timestamp}.csv`,
      };
    }

    // Default: JSON
    return {
      data: JSON.stringify(records, null, 2),
      contentType: 'application/json; charset=utf-8',
      filename: `uaforge-export-${timestamp}.json`,
    };
  }
}
