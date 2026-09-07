import type {
  Bank,
  BenchmarkGroup,
  BenchmarkComponent,
  BenchmarkCell,
  SourcePair,
  CrawlJob,
  CrawlItem,
  ScoreValue,
  AppUser,
} from '../types/index.ts';
import {
  DEFAULT_ORG_ID,
  INITIAL_BANKS,
  INITIAL_SOURCE_PAIRS,
  INITIAL_GROUPS,
  INITIAL_COMPONENTS,
  INITIAL_CELLS,
  INITIAL_CRAWL_ITEMS,
} from './initialData';
import { getSupabaseAdmin, getSupabaseClient } from './supabase';

class Store {
  private orgId = DEFAULT_ORG_ID;
  private banks: Bank[] = JSON.parse(JSON.stringify(INITIAL_BANKS));
  private sourcePairs: SourcePair[] = JSON.parse(JSON.stringify(INITIAL_SOURCE_PAIRS));
  private groups: BenchmarkGroup[] = JSON.parse(JSON.stringify(INITIAL_GROUPS));
  private components: BenchmarkComponent[] = JSON.parse(JSON.stringify(INITIAL_COMPONENTS));
  private cells: BenchmarkCell[] = JSON.parse(JSON.stringify(INITIAL_CELLS));
  private crawlJobs: CrawlJob[] = [];
  private crawlItems: CrawlItem[] = JSON.parse(JSON.stringify(INITIAL_CRAWL_ITEMS));
  private users: AppUser[] = [
    {
      id: 'usr-admin',
      username: 'admin',
      password: 'mb@2025',
      name: 'Nguyễn Văn Quản Trị',
      email: 'admin@mbbank.com.vn',
      role: 'admin',
      role_name: 'Quản trị viên hệ thống',
      department: 'Khối Chuyển đổi số & CNTT',
      avatar_initials: 'QT',
      is_active: true,
      created_at: '2026-09-01T08:00:00.000Z',
      updated_at: '2026-09-01T08:00:00.000Z',
    },
    {
      id: 'usr-chienluoc',
      username: 'chienluoc',
      password: 'mb@2025',
      name: 'Nguyễn Hoàng',
      email: 'hoangnv@mbbank.com.vn',
      role: 'strategist',
      role_name: 'Chuyên viên Chiến lược cấp cao',
      department: 'Khối Chiến lược',
      avatar_initials: 'NH',
      is_active: true,
      created_at: '2026-09-01T08:00:00.000Z',
      updated_at: '2026-09-01T08:00:00.000Z',
    },
    {
      id: 'usr-analyst',
      username: 'user',
      password: '123456',
      name: 'Trần Minh Tuấn',
      email: 'tuantm@mbbank.com.vn',
      role: 'analyst',
      role_name: 'Chuyên viên Nghiên cứu Sản phẩm',
      department: 'Khối KH Doanh nghiệp SME',
      avatar_initials: 'MT',
      is_active: true,
      created_at: '2026-09-01T08:00:00.000Z',
      updated_at: '2026-09-01T08:00:00.000Z',
    },
  ];

  private getClient() {
    return getSupabaseAdmin() || getSupabaseClient();
  }

  // --- BANKS ---
  async getBanks(): Promise<Bank[]> {
    const supabase = this.getClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('banks')
        .select('*')
        .eq('org_id', this.orgId)
        .order('display_order', { ascending: true });
      if (!error && data && data.length > 0) {
        return data as Bank[];
      }
    }
    return [...this.banks].sort((a, b) => a.display_order - b.display_order);
  }

  async getBankById(id: string): Promise<Bank | undefined> {
    const supabase = this.getClient();
    if (supabase) {
      const { data } = await supabase.from('banks').select('*').eq('id', id).single();
      if (data) return data as Bank;
    }
    return this.banks.find((b) => b.id === id);
  }

  async createBank(name: string, code: string, isMb: boolean = false): Promise<Bank> {
    const upperCode = code.toUpperCase();
    const existing = this.banks.find((b) => b.code.toUpperCase() === upperCode);
    if (existing) {
      throw new Error(`Mã ngân hàng ${code} đã tồn tại`);
    }

    const maxOrder = this.banks.reduce((max, b) => Math.max(max, b.display_order), -1);
    const newBank: Bank = {
      id: crypto.randomUUID(),
      org_id: this.orgId,
      name,
      code: upperCode,
      is_mb: isMb,
      active: true,
      display_order: maxOrder + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const supabase = this.getClient();
    if (supabase) {
      const { data, error } = await supabase.from('banks').insert({
        id: newBank.id,
        org_id: this.orgId,
        name,
        code: upperCode,
        is_mb: isMb,
        active: true,
        display_order: maxOrder + 1,
      }).select().single();
      if (!error && data) {
        newBank.id = data.id;
      }
    }

    this.banks.push(newBank);
    return newBank;
  }

  async updateBank(id: string, updates: Partial<Bank>): Promise<Bank> {
    const supabase = this.getClient();
    if (supabase) {
      await supabase
        .from('banks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
    }

    const index = this.banks.findIndex((b) => b.id === id);
    if (index !== -1) {
      this.banks[index] = { ...this.banks[index], ...updates, updated_at: new Date().toISOString() };
      return this.banks[index];
    }
    return { id, org_id: this.orgId, name: '', code: '', is_mb: false, active: true, display_order: 0, ...updates };
  }

  async deleteBank(id: string): Promise<void> {
    const bank = this.banks.find((b) => b.id === id);
    if (bank && bank.is_mb) throw new Error('Không thể xóa cột BIZ MBBank');

    const supabase = this.getClient();
    if (supabase) {
      await supabase.from('banks').delete().eq('id', id);
    }

    this.banks = this.banks.filter((b) => b.id !== id);
    this.cells = this.cells.filter((c) => c.bank_id !== id);
    this.sourcePairs = this.sourcePairs.filter((s) => s.bank_id !== id);
  }

  async reorderBanks(bankIds: string[]): Promise<Bank[]> {
    const supabase = this.getClient();
    if (supabase) {
      for (let idx = 0; idx < bankIds.length; idx++) {
        await supabase
          .from('banks')
          .update({ display_order: idx, updated_at: new Date().toISOString() })
          .eq('id', bankIds[idx]);
      }
    }

    bankIds.forEach((id, idx) => {
      const bank = this.banks.find((b) => b.id === id);
      if (bank) {
        bank.display_order = idx;
        bank.updated_at = new Date().toISOString();
      }
    });
    return this.getBanks();
  }

  // --- SOURCE PAIRS ---
  async getSourcePairs(): Promise<SourcePair[]> {
    const supabase = this.getClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('source_pairs')
        .select('*, banks(name)')
        .eq('org_id', this.orgId)
        .order('display_order', { ascending: true });
      if (!error && data && data.length > 0) {
        return data.map((item: any) => ({
          ...item,
          bank_name: item.banks?.name || item.bank_name || 'Ngân hàng mới',
        })) as SourcePair[];
      }
    }
    return [...this.sourcePairs].sort((a, b) => a.display_order - b.display_order);
  }

  async createSourcePair(data: {
    bank_id?: string;
    bank_name?: string;
    facebook_url?: string;
    website_url?: string;
  }): Promise<SourcePair> {
    const fbUrl = (data.facebook_url || '').trim();
    const webUrl = (data.website_url || '').trim();

    if (!fbUrl && !webUrl) {
      throw new Error('Nhập ít nhất một URL Facebook hoặc Website');
    }

    const detectedBankName = data.bank_name || detectBankName(fbUrl || webUrl);
    const maxOrder = this.sourcePairs.reduce((max, s) => Math.max(max, s.display_order), -1);

    let targetBankId = data.bank_id;
    if (!targetBankId) {
      const existingBank = this.banks.find(
        (b) => b.name.toLowerCase() === detectedBankName.toLowerCase()
      );
      if (existingBank) {
        targetBankId = existingBank.id;
      } else {
        const newBank = await this.createBank(
          detectedBankName,
          detectedBankName.substring(0, 4).toUpperCase()
        );
        targetBankId = newBank.id;
      }
    }

    const pair: SourcePair = {
      id: crypto.randomUUID(),
      org_id: this.orgId,
      bank_id: targetBankId,
      bank_name: detectedBankName,
      facebook_url: fbUrl,
      website_url: webUrl,
      facebook_verified: false,
      website_verified: false,
      display_order: maxOrder + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const supabase = this.getClient();
    if (supabase) {
      const { data: dbData, error } = await supabase.from('source_pairs').insert({
        id: pair.id,
        org_id: this.orgId,
        bank_id: targetBankId,
        facebook_url: fbUrl,
        website_url: webUrl,
        facebook_verified: false,
        website_verified: false,
        display_order: maxOrder + 1,
      }).select().single();
      if (!error && dbData) {
        pair.id = dbData.id;
      }
    }

    this.sourcePairs.push(pair);
    return pair;
  }

  async updateSourcePair(id: string, updates: Partial<SourcePair>): Promise<SourcePair> {
    const supabase = this.getClient();
    if (supabase) {
      const dbUpdates: any = { ...updates, updated_at: new Date().toISOString() };
      delete dbUpdates.bank_name;
      delete dbUpdates.banks;
      await supabase
        .from('source_pairs')
        .update(dbUpdates)
        .eq('id', id);
    }

    const index = this.sourcePairs.findIndex((s) => s.id === id);
    if (index !== -1) {
      this.sourcePairs[index] = { ...this.sourcePairs[index], ...updates, updated_at: new Date().toISOString() };
      return this.sourcePairs[index];
    }
    return { id, org_id: this.orgId, bank_id: '', facebook_url: '', website_url: '', facebook_verified: false, website_verified: false, display_order: 0, ...updates };
  }

  async verifySourcePair(id: string, type: 'facebook' | 'website'): Promise<SourcePair> {
    const pair = this.sourcePairs.find((s) => s.id === id);
    if (!pair) throw new Error('Không tìm thấy nguồn');

    const url = type === 'facebook' ? pair.facebook_url : pair.website_url;
    if (!url || !url.trim()) throw new Error('Chưa có URL để xác thực');

    const detected = detectBankName(url);
    if (type === 'facebook') {
      pair.facebook_verified = true;
    } else {
      pair.website_verified = true;
    }

    if (detected && detected !== 'Ngân hàng mới') {
      pair.bank_name = detected;
    }
    pair.updated_at = new Date().toISOString();

    const supabase = this.getClient();
    if (supabase) {
      await supabase
        .from('source_pairs')
        .update({
          facebook_verified: pair.facebook_verified,
          website_verified: pair.website_verified,
          updated_at: pair.updated_at,
        })
        .eq('id', id);
    }

    return pair;
  }

  async deleteSourcePair(id: string): Promise<void> {
    const supabase = this.getClient();
    if (supabase) {
      await supabase.from('source_pairs').delete().eq('id', id);
    }
    this.sourcePairs = this.sourcePairs.filter((s) => s.id !== id);
  }

  // --- BENCHMARK GROUPS ---
  async getGroups(): Promise<BenchmarkGroup[]> {
    const supabase = this.getClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('benchmark_groups')
        .select('*')
        .eq('org_id', this.orgId)
        .order('display_order', { ascending: true });
      if (!error && data && data.length > 0) {
        const total = data.length;
        return data.map((g: any, idx: number) => ({
          ...g,
          side: g.side || (idx < Math.ceil(total / 2) ? 'left' : 'right'),
        })) as BenchmarkGroup[];
      }
    }
    return [...this.groups].sort((a, b) => a.display_order - b.display_order);
  }

  async createGroup(name: string, side: 'left' | 'right' = 'left'): Promise<BenchmarkGroup> {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Nhập tên nhóm');
    if (this.groups.some((g) => g.name === trimmed)) {
      throw new Error('Tên nhóm đã tồn tại');
    }

    const maxOrder = this.groups.reduce((max, g) => Math.max(max, g.display_order), -1);
    const newGroup: BenchmarkGroup = {
      id: crypto.randomUUID(),
      org_id: this.orgId,
      name: trimmed,
      side,
      active: true,
      display_order: maxOrder + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const supabase = this.getClient();
    if (supabase) {
      const { data, error } = await supabase.from('benchmark_groups').insert({
        id: newGroup.id,
        org_id: this.orgId,
        name: trimmed,
        active: true,
        display_order: maxOrder + 1,
      }).select().single();
      if (!error && data) {
        newGroup.id = data.id;
      }
    }

    this.groups.push(newGroup);
    return newGroup;
  }

  async updateGroup(id: string, updates: Partial<BenchmarkGroup>): Promise<BenchmarkGroup> {
    const supabase = this.getClient();
    if (supabase) {
      const dbUpdates: any = { ...updates, updated_at: new Date().toISOString() };
      delete dbUpdates.side;
      await supabase
        .from('benchmark_groups')
        .update(dbUpdates)
        .eq('id', id);
    }

    const index = this.groups.findIndex((g) => g.id === id);
    if (index !== -1) {
      this.groups[index] = { ...this.groups[index], ...updates, updated_at: new Date().toISOString() };
      return this.groups[index];
    }
    return { id, org_id: this.orgId, name: '', display_order: 0, active: true, ...updates };
  }

  async deleteGroup(id: string): Promise<void> {
    const supabase = this.getClient();
    if (supabase) {
      await supabase.from('benchmark_groups').delete().eq('id', id);
    }

    const compIds = this.components.filter((c) => c.group_id === id).map((c) => c.id);
    this.groups = this.groups.filter((g) => g.id !== id);
    this.components = this.components.filter((c) => c.group_id !== id);
    this.cells = this.cells.filter((cell) => !compIds.includes(cell.component_id));
  }

  async reorderGroups(groupIds: string[]): Promise<BenchmarkGroup[]> {
    const supabase = this.getClient();
    if (supabase) {
      for (let idx = 0; idx < groupIds.length; idx++) {
        await supabase
          .from('benchmark_groups')
          .update({ display_order: idx, updated_at: new Date().toISOString() })
          .eq('id', groupIds[idx]);
      }
    }

    groupIds.forEach((id, idx) => {
      const g = this.groups.find((item) => item.id === id);
      if (g) {
        g.display_order = idx;
        g.updated_at = new Date().toISOString();
      }
    });
    return this.getGroups();
  }

  // --- BENCHMARK COMPONENTS ---
  async getComponents(): Promise<BenchmarkComponent[]> {
    const supabase = this.getClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('benchmark_components')
        .select('*')
        .eq('org_id', this.orgId)
        .order('display_order', { ascending: true });
      if (!error && data && data.length > 0) {
        return data as BenchmarkComponent[];
      }
    }
    return [...this.components].sort((a, b) => a.display_order - b.display_order);
  }

  async createComponent(groupId: string, name: string): Promise<BenchmarkComponent> {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Nhập tên cấu phần');

    const maxOrder = this.components.reduce((max, c) => Math.max(max, c.display_order), -1);
    const newComp: BenchmarkComponent = {
      id: crypto.randomUUID(),
      org_id: this.orgId,
      group_id: groupId,
      name: trimmed,
      active: true,
      display_order: maxOrder + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const supabase = this.getClient();
    if (supabase) {
      const { data, error } = await supabase.from('benchmark_components').insert({
        id: newComp.id,
        org_id: this.orgId,
        group_id: groupId,
        name: trimmed,
        active: true,
        display_order: maxOrder + 1,
      }).select().single();
      if (!error && data) {
        newComp.id = data.id;
      }
    }

    this.components.push(newComp);

    for (const bank of this.banks) {
      const cellId = crypto.randomUUID();
      const cell: BenchmarkCell = {
        id: cellId,
        org_id: this.orgId,
        component_id: newComp.id,
        bank_id: bank.id,
        description: '',
        score: null,
      };
      this.cells.push(cell);

      if (supabase) {
        await supabase.from('benchmark_cells').insert({
          id: cellId,
          org_id: this.orgId,
          component_id: newComp.id,
          bank_id: bank.id,
          description: '',
          score: null,
        });
      }
    }

    return newComp;
  }

  async updateComponent(id: string, updates: Partial<BenchmarkComponent>): Promise<BenchmarkComponent> {
    const supabase = this.getClient();
    if (supabase) {
      await supabase
        .from('benchmark_components')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
    }

    const index = this.components.findIndex((c) => c.id === id);
    if (index !== -1) {
      this.components[index] = { ...this.components[index], ...updates, updated_at: new Date().toISOString() };
      return this.components[index];
    }
    return { id, org_id: this.orgId, group_id: '', name: '', display_order: 0, active: true, ...updates };
  }

  async duplicateComponent(id: string): Promise<BenchmarkComponent> {
    const original = this.components.find((c) => c.id === id);
    if (!original) throw new Error('Không tìm thấy cấu phần');

    const index = this.components.indexOf(original);
    const newComp: BenchmarkComponent = {
      id: crypto.randomUUID(),
      org_id: this.orgId,
      group_id: original.group_id,
      name: `${original.name} (copy)`,
      active: true,
      display_order: original.display_order + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const supabase = this.getClient();
    if (supabase) {
      await supabase.from('benchmark_components').insert({
        id: newComp.id,
        org_id: this.orgId,
        group_id: newComp.group_id,
        name: newComp.name,
        active: true,
        display_order: newComp.display_order,
      });
    }

    this.components.splice(index + 1, 0, newComp);

    const originalCells = this.cells.filter((c) => c.component_id === id);
    for (const cell of originalCells) {
      const newCellId = crypto.randomUUID();
      const duplicateCell: BenchmarkCell = {
        id: newCellId,
        org_id: this.orgId,
        component_id: newComp.id,
        bank_id: cell.bank_id,
        description: cell.description,
        score: cell.score,
      };
      this.cells.push(duplicateCell);

      if (supabase) {
        await supabase.from('benchmark_cells').insert({
          id: newCellId,
          org_id: this.orgId,
          component_id: newComp.id,
          bank_id: cell.bank_id,
          description: cell.description,
          score: cell.score,
        });
      }
    }

    return newComp;
  }

  async deleteComponent(id: string): Promise<void> {
    const supabase = this.getClient();
    if (supabase) {
      await supabase.from('benchmark_components').delete().eq('id', id);
    }
    this.components = this.components.filter((c) => c.id !== id);
    this.cells = this.cells.filter((c) => c.component_id !== id);
  }

  async reorderComponents(componentOrders: { id: string; group_id: string; display_order: number }[]): Promise<BenchmarkComponent[]> {
    const supabase = this.getClient();
    if (supabase) {
      for (const item of componentOrders) {
        await supabase
          .from('benchmark_components')
          .update({
            group_id: item.group_id,
            display_order: item.display_order,
            updated_at: new Date().toISOString(),
          })
          .eq('id', item.id);
      }
    }

    componentOrders.forEach((item) => {
      const comp = this.components.find((c) => c.id === item.id);
      if (comp) {
        comp.group_id = item.group_id;
        comp.display_order = item.display_order;
        comp.updated_at = new Date().toISOString();
      }
    });
    return this.getComponents();
  }

  // --- BENCHMARK CELLS ---
  async getCells(): Promise<BenchmarkCell[]> {
    const supabase = this.getClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('benchmark_cells')
        .select('*')
        .eq('org_id', this.orgId);
      if (!error && data && data.length > 0) {
        return data as BenchmarkCell[];
      }
    }
    return [...this.cells];
  }

  async updateCell(componentId: string, bankId: string, description: string, score: ScoreValue): Promise<BenchmarkCell> {
    const supabase = this.getClient();
    if (supabase) {
      await supabase.from('benchmark_cells').upsert(
        {
          org_id: this.orgId,
          component_id: componentId,
          bank_id: bankId,
          description,
          score,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'org_id,component_id,bank_id' }
      );
    }

    let cell = this.cells.find((c) => c.component_id === componentId && c.bank_id === bankId);
    if (!cell) {
      cell = {
        id: crypto.randomUUID(),
        org_id: this.orgId,
        component_id: componentId,
        bank_id: bankId,
        description,
        score,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.cells.push(cell);
    } else {
      cell.description = description;
      cell.score = score;
      cell.updated_at = new Date().toISOString();
    }
    return cell;
  }

  async batchUpdateCells(cellUpdates: { component_id: string; bank_id: string; description: string; score: ScoreValue }[]): Promise<BenchmarkCell[]> {
    const results: BenchmarkCell[] = [];
    for (const u of cellUpdates) {
      results.push(await this.updateCell(u.component_id, u.bank_id, u.description, u.score));
    }
    return results;
  }

  // --- IMPORT FULL BENCHMARK DATA ---
  async importBenchmarkData(data: {
    banks: { name: string; code: string; isMB: boolean }[];
    groups: string[];
    rows: { group: string; feature: string; values: Record<string, string>; scores?: Record<string, ScoreValue> }[];
  }): Promise<void> {
    const nextBanks: Bank[] = data.banks.map((b, idx) => ({
      id: crypto.randomUUID(),
      org_id: this.orgId,
      name: b.name,
      code: b.code,
      is_mb: b.isMB,
      active: true,
      display_order: idx,
    }));

    const groupMap = new Map<string, BenchmarkGroup>();
    const nextGroups: BenchmarkGroup[] = data.groups.map((gName, idx) => {
      const g: BenchmarkGroup = {
        id: crypto.randomUUID(),
        org_id: this.orgId,
        name: gName,
        display_order: idx,
        active: true,
        side: idx < Math.ceil(data.groups.length / 2) ? 'left' : 'right',
      };
      groupMap.set(gName, g);
      return g;
    });

    const nextComponents: BenchmarkComponent[] = [];
    const nextCells: BenchmarkCell[] = [];

    data.rows.forEach((row, rowIdx) => {
      const group = groupMap.get(row.group) || nextGroups[0];
      const compId = crypto.randomUUID();

      nextComponents.push({
        id: compId,
        org_id: this.orgId,
        group_id: group.id,
        name: row.feature,
        display_order: rowIdx,
        active: true,
      });

      nextBanks.forEach((bank) => {
        const desc = row.values[bank.code] || '';
        const score = row.scores?.[bank.code] ?? null;

        nextCells.push({
          id: crypto.randomUUID(),
          org_id: this.orgId,
          component_id: compId,
          bank_id: bank.id,
          description: desc,
          score,
        });
      });
    });

    const supabase = this.getClient();
    if (supabase) {
      try {
        for (const b of nextBanks) {
          await supabase.from('banks').upsert({
            id: b.id,
            org_id: this.orgId,
            name: b.name,
            code: b.code,
            is_mb: b.is_mb,
            active: b.active,
            display_order: b.display_order,
          }, { onConflict: 'org_id,code' });
        }
        for (const g of nextGroups) {
          await supabase.from('benchmark_groups').insert({
            id: g.id,
            org_id: this.orgId,
            name: g.name,
            display_order: g.display_order,
            active: g.active,
          });
        }
        for (const c of nextComponents) {
          await supabase.from('benchmark_components').insert({
            id: c.id,
            org_id: this.orgId,
            group_id: c.group_id,
            name: c.name,
            display_order: c.display_order,
            active: c.active,
          });
        }
        for (const cell of nextCells) {
          await supabase.from('benchmark_cells').insert({
            id: cell.id,
            org_id: this.orgId,
            component_id: cell.component_id,
            bank_id: cell.bank_id,
            description: cell.description,
            score: cell.score,
          });
        }
      } catch (err) {
        console.error('Error persisting import to Supabase:', err);
      }
    }

    this.banks = nextBanks;
    this.groups = nextGroups;
    this.components = nextComponents;
    this.cells = nextCells;
  }

  // --- CRAWL ITEMS & JOBS ---
  async getCrawlItems(): Promise<CrawlItem[]> {
    const supabase = this.getClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('crawl_items')
        .select('*, banks(name)')
        .eq('org_id', this.orgId)
        .order('detected_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data.map((item: any) => ({
          ...item,
          bank_name: item.banks?.name || item.bank_name || 'Techcombank',
        })) as CrawlItem[];
      }
    }
    return [...this.crawlItems].sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime());
  }

  async updateCrawlItemStatus(id: string, status: 'accepted' | 'rejected' | 'needs_review'): Promise<CrawlItem> {
    const supabase = this.getClient();
    if (supabase) {
      await supabase.from('crawl_items').update({ status }).eq('id', id);
    }
    const item = this.crawlItems.find((i) => i.id === id);
    if (!item) throw new Error('Không tìm thấy crawl item');
    item.status = status;
    return item;
  }

  async createCrawlJob(dateFrom: string, dateTo: string): Promise<CrawlJob> {
    const job: CrawlJob = {
      id: crypto.randomUUID(),
      org_id: this.orgId,
      date_from: dateFrom,
      date_to: dateTo,
      status: 'queued',
      progress: 0,
      created_at: new Date().toISOString(),
    };

    const supabase = this.getClient();
    if (supabase) {
      await supabase.from('crawl_jobs').insert({
        id: job.id,
        org_id: this.orgId,
        date_from: dateFrom,
        date_to: dateTo,
        status: 'queued',
        progress: 0,
      });
    }

    this.crawlJobs.unshift(job);
    return job;
  }

  async getCrawlJob(id: string): Promise<CrawlJob | undefined> {
    const supabase = this.getClient();
    if (supabase) {
      const { data } = await supabase.from('crawl_jobs').select('*').eq('id', id).single();
      if (data) return data as CrawlJob;
    }
    return this.crawlJobs.find((j) => j.id === id);
  }

  async updateCrawlJob(id: string, updates: Partial<CrawlJob>): Promise<CrawlJob> {
    const supabase = this.getClient();
    if (supabase) {
      await supabase.from('crawl_jobs').update(updates).eq('id', id);
    }
    const job = this.crawlJobs.find((j) => j.id === id);
    if (!job) throw new Error('Không tìm thấy job');
    Object.assign(job, updates);
    return job;
  }

  async addDiscoveredItem(item: Partial<CrawlItem>): Promise<CrawlItem> {
    const fullItem: CrawlItem = {
      id: crypto.randomUUID(),
      org_id: this.orgId,
      bank_id: item.bank_id || this.banks[0].id,
      bank_name: item.bank_name || 'Techcombank',
      source_type: item.source_type || 'website',
      source_url: item.source_url || 'https://www.techcombank.com.vn',
      detected_at: new Date().toISOString().split('T')[0],
      title: item.title || 'Tính năng sản phẩm mới phát hiện',
      feature_name: item.feature_name || 'Tính năng số',
      summary: item.summary || 'Phát hiện nội dung có liên quan đến sản phẩm/tính năng doanh nghiệp.',
      content_hash: `hash-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      status: 'new',
    };

    const supabase = this.getClient();
    if (supabase) {
      await supabase.from('crawl_items').insert({
        id: fullItem.id,
        org_id: this.orgId,
        bank_id: fullItem.bank_id,
        source_type: fullItem.source_type,
        source_url: fullItem.source_url,
        detected_at: new Date().toISOString(),
        title: fullItem.title,
        feature_name: fullItem.feature_name,
        summary: fullItem.summary,
        content_hash: fullItem.content_hash,
        status: fullItem.status,
      });
    }

    this.crawlItems.unshift(fullItem);
    return fullItem;
  }

  // --- USERS ---
  async getUsers(): Promise<AppUser[]> {
    const supabase = this.getClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('app_users')
        .select('*')
        .order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        return data as AppUser[];
      }
    }
    return [...this.users];
  }

  async getUserById(id: string): Promise<AppUser | undefined> {
    const supabase = this.getClient();
    if (supabase) {
      const { data } = await supabase.from('app_users').select('*').eq('id', id).single();
      if (data) return data as AppUser;
    }
    return this.users.find((u) => u.id === id);
  }

  async getUserByUsername(username: string): Promise<AppUser | undefined> {
    const uname = username.trim().toLowerCase();
    const supabase = this.getClient();
    if (supabase) {
      const { data } = await supabase
        .from('app_users')
        .select('*')
        .or(`username.eq.${uname},email.eq.${uname}`)
        .single();
      if (data) return data as AppUser;
    }
    return this.users.find(
      (u) => u.username.toLowerCase() === uname || (u.email && u.email.toLowerCase() === uname)
    );
  }

  async createUser(payload: {
    username: string;
    password: string;
    name: string;
    email?: string;
    role?: 'admin' | 'strategist' | 'analyst';
    role_name?: string;
    department?: string;
  }): Promise<AppUser> {
    const nameWords = payload.name.trim().split(/\s+/);
    let avatarInitials = 'MB';
    if (nameWords.length === 1) {
      avatarInitials = nameWords[0].slice(0, 2).toUpperCase();
    } else if (nameWords.length >= 2) {
      avatarInitials = (nameWords[nameWords.length - 2][0] + nameWords[nameWords.length - 1][0]).toUpperCase();
    }

    const fullUser: AppUser = {
      id: crypto.randomUUID(),
      username: payload.username.trim().toLowerCase(),
      password: payload.password.trim(),
      name: payload.name.trim(),
      email: payload.email?.trim() || `${payload.username.trim().toLowerCase()}@mbbank.com.vn`,
      role: payload.role || 'analyst',
      role_name: payload.role_name || (payload.role === 'admin' ? 'Quản trị viên hệ thống' : payload.role === 'strategist' ? 'Chuyên viên Chiến lược' : 'Chuyên viên Nghiên cứu'),
      department: payload.department || 'Khối Chiến lược',
      avatar_initials: avatarInitials,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const supabase = this.getClient();
    if (supabase) {
      const { data, error } = await supabase.from('app_users').insert(fullUser).select().single();
      if (!error && data) {
        return data as AppUser;
      }
    }

    this.users.push(fullUser);
    return fullUser;
  }

  async updateUser(id: string, payload: Partial<AppUser>): Promise<AppUser | undefined> {
    const supabase = this.getClient();
    const updateData = { ...payload, updated_at: new Date().toISOString() };
    if (payload.name) {
      const nameWords = payload.name.trim().split(/\s+/);
      if (nameWords.length === 1) {
        updateData.avatar_initials = nameWords[0].slice(0, 2).toUpperCase();
      } else if (nameWords.length >= 2) {
        updateData.avatar_initials = (nameWords[nameWords.length - 2][0] + nameWords[nameWords.length - 1][0]).toUpperCase();
      }
    }

    if (supabase) {
      const { data, error } = await supabase.from('app_users').update(updateData).eq('id', id).select().single();
      if (!error && data) {
        return data as AppUser;
      }
    }

    const idx = this.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      this.users[idx] = { ...this.users[idx], ...updateData };
      return this.users[idx];
    }
    return undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    const supabase = this.getClient();
    if (supabase) {
      const { error } = await supabase.from('app_users').delete().eq('id', id);
      if (!error) return true;
    }

    const initialLen = this.users.length;
    this.users = this.users.filter((u) => u.id !== id);
    return this.users.length < initialLen;
  }
}

function detectBankName(url: string): string {
  const u = (url || '').toLowerCase();
  if (u.includes('techcom')) return 'Techcombank Business';
  if (u.includes('vietin')) return 'VietinBank eFAST';
  if (u.includes('vpbank')) return 'VPBank NEOBiz';
  if (u.includes('bidv')) return 'BIDV (BIDV Direct)';
  if (u.includes('vietcom')) return 'Vietcombank';
  if (u.includes('acb')) return 'ACB ONE BIZ';
  if (u.includes('tpbank') || u.includes('tpb')) return 'TPBank Biz';
  if (u.includes('agribank')) return 'Agribank';
  if (u.includes('vietbank')) return 'Vietbank';
  if (u.includes('mb') || u.includes('mbbank')) return 'BIZ MBBank';
  return 'Ngân hàng mới';
}

export const store = new Store();
