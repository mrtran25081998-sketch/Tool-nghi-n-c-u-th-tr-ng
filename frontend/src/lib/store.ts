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
  CrawlSource,
  SourceDiscoveredUrl,
  CrawlSnapshot,
  CrawlContent,
  DiscoverySourceItem,
  SourceLineageStatus,
  UrlValidationStatus,
  ProductDiscovery,
  DiscoverySource,
  ReviewAction,
  VerificationStatus,
  DiscoveryReviewStatus,
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
import { INITIAL_BANK_SEEDS } from './crawler/initialCrawlerSeeds';
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
  private crawlSources: CrawlSource[] = [];
  private discoveredUrls: SourceDiscoveredUrl[] = [];
  private crawlSnapshots: CrawlSnapshot[] = [];
  private productDiscoveries: ProductDiscovery[] = [];
  private crawlContents: CrawlContent[] = [];
  private reviewActions: ReviewAction[] = [];
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
      await supabase.from('benchmark_cells').delete().eq('bank_id', id);
      await supabase.from('source_pairs').delete().eq('bank_id', id);
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
        const dbList = data.map((item: any) => ({
          ...item,
          bank_name: item.banks?.name || item.bank_name || 'Ngân hàng mới',
        })) as SourcePair[];

        // Normalize helper to compare bank names accurately
        const norm = (s: string) =>
          (s || '')
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .replace(/nganhang|bank|biz|business|efast|direct|neobiz|onebiz/g, '');

        const dbBankNames = new Set(dbList.map((p) => norm(p.bank_name || '')));

        const missingDefaults = this.sourcePairs.filter((defaultPair) => {
          const defaultNormalized = norm(defaultPair.bank_name || '');
          return (
            !dbBankNames.has(defaultNormalized) &&
            !dbList.some((db) => db.bank_id === defaultPair.bank_id)
          );
        });

        if (missingDefaults.length > 0) {
          return [...dbList, ...missingDefaults].sort(
            (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)
          );
        }

        return dbList;
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

    const url = (type === 'facebook' ? pair.facebook_url : pair.website_url || '').trim();
    if (!url) throw new Error('Chưa có URL để xác thực');

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      throw new Error('URL phải bắt đầu bằng http:// hoặc https://');
    }

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
    const memCompIds = this.components.filter((c) => c.group_id === id).map((c) => c.id);

    if (supabase) {
      const { data: dbComps } = await supabase.from('benchmark_components').select('id').eq('group_id', id);
      const allCompIds = Array.from(new Set([...memCompIds, ...(dbComps || []).map((c: any) => c.id)]));

      if (allCompIds.length > 0) {
        await supabase.from('benchmark_cells').delete().in('component_id', allCompIds);
        await supabase.from('benchmark_components').delete().in('id', allCompIds);
      }
      await supabase.from('benchmark_groups').delete().eq('id', id);
    }

    this.groups = this.groups.filter((g) => g.id !== id);
    this.components = this.components.filter((c) => c.group_id !== id);
    this.cells = this.cells.filter((cell) => !memCompIds.includes(cell.component_id));
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
    const supabase = this.getClient();

    // 1. Find original component (memory or Supabase)
    let original = this.components.find((c) => c.id === id);
    if (!original && supabase) {
      const { data } = await supabase.from('benchmark_components').select('*').eq('id', id).single();
      if (data) original = data as BenchmarkComponent;
    }
    if (!original) throw new Error('Không tìm thấy cấu phần để nhân bản');

    // 2. Determine target display_order directly below original
    const newOrder = (original.display_order ?? 0) + 1;

    // Shift all components in the same group with display_order >= newOrder
    this.components.forEach((c) => {
      if (c.group_id === original.group_id && c.id !== original.id && c.display_order >= newOrder) {
        c.display_order += 1;
        c.updated_at = new Date().toISOString();
      }
    });

    if (supabase) {
      const { data: laterComps } = await supabase
        .from('benchmark_components')
        .select('*')
        .eq('group_id', original.group_id)
        .gte('display_order', newOrder);

      if (laterComps && laterComps.length > 0) {
        for (const lc of laterComps) {
          if (lc.id !== original.id) {
            await supabase
              .from('benchmark_components')
              .update({ display_order: lc.display_order + 1, updated_at: new Date().toISOString() })
              .eq('id', lc.id);
          }
        }
      }
    }

    // 3. Create new duplicated component
    const newComp: BenchmarkComponent = {
      id: crypto.randomUUID(),
      org_id: this.orgId,
      group_id: original.group_id,
      name: `${original.name} (Bản sao)`,
      active: true,
      display_order: newOrder,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

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

    const originalIdx = this.components.findIndex((c) => c.id === original.id);
    if (originalIdx !== -1) {
      this.components.splice(originalIdx + 1, 0, newComp);
    } else {
      this.components.push(newComp);
    }

    // 4. Duplicate all cells for this component across all banks
    let originalCells = this.cells.filter((c) => c.component_id === id);
    if (supabase) {
      const { data: dbCells } = await supabase.from('benchmark_cells').select('*').eq('component_id', id);
      if (dbCells && dbCells.length > 0) {
        originalCells = dbCells as BenchmarkCell[];
      }
    }

    // If no cells existed, initialize default cells for all banks
    const banks = await this.getBanks();
    for (const bank of banks) {
      const existingCell = originalCells.find((c) => c.bank_id === bank.id);
      const newCellId = crypto.randomUUID();
      const duplicateCell: BenchmarkCell = {
        id: newCellId,
        org_id: this.orgId,
        component_id: newComp.id,
        bank_id: bank.id,
        description: existingCell ? existingCell.description : '',
        score: existingCell ? existingCell.score : null,
      };
      this.cells.push(duplicateCell);

      if (supabase) {
        await supabase.from('benchmark_cells').insert({
          id: newCellId,
          org_id: this.orgId,
          component_id: newComp.id,
          bank_id: bank.id,
          description: duplicateCell.description,
          score: duplicateCell.score,
        });
      }
    }

    return newComp;
  }

  async deleteComponent(id: string): Promise<void> {
    const supabase = this.getClient();
    if (supabase) {
      await supabase.from('benchmark_cells').delete().eq('component_id', id);
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

    this.crawlJobs.unshift(job);

    const supabase = this.getClient();
    if (supabase) {
      try {
        await supabase.from('crawl_jobs').insert({
          id: job.id,
          org_id: this.orgId,
          date_from: dateFrom,
          date_to: dateTo,
          status: 'queued',
          progress: 0,
        });
      } catch (err) {
        console.warn('Supabase crawl_jobs insert warning:', err);
      }
    }

    return job;
  }

  async getCrawlJobs(): Promise<CrawlJob[]> {
    const supabase = this.getClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('crawl_jobs').select('*').order('created_at', { ascending: false });
        if (!error && data && data.length > 0) return data as CrawlJob[];
      } catch (err) {
        console.warn('Supabase getCrawlJobs warning:', err);
      }
    }
    return [...this.crawlJobs];
  }

  async getCrawlJob(id: string): Promise<CrawlJob | undefined> {
    const supabase = this.getClient();
    if (supabase) {
      try {
        const { data } = await supabase.from('crawl_jobs').select('*').eq('id', id).single();
        if (data) return data as CrawlJob;
      } catch (err) {
        console.warn('Supabase getCrawlJob warning:', err);
      }
    }
    return this.crawlJobs.find((j) => j.id === id);
  }

  async updateCrawlJob(id: string, updates: Partial<CrawlJob>): Promise<CrawlJob> {
    const job = this.crawlJobs.find((j) => j.id === id);
    if (job) {
      Object.assign(job, updates);
    }

    const supabase = this.getClient();
    if (supabase) {
      try {
        await supabase.from('crawl_jobs').update(updates).eq('id', id);
      } catch (err) {
        console.warn('Supabase updateCrawlJob warning:', err);
      }
    }

    if (!job) throw new Error('Không tìm thấy job');
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

    this.crawlItems.unshift(fullItem);

    const supabase = this.getClient();
    if (supabase) {
      try {
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
      } catch (err) {
        console.warn('Supabase addDiscoveredItem warning:', err);
      }
    }

    return fullItem;
  }

  // --- CRAWLER INTELLIGENCE & PRODUCT DISCOVERIES ---
  private initCrawlerSeeds() {
    if (this.productDiscoveries.length > 0) return;

    const tcbBank = this.banks.find((b) => b.code === 'TCB') || this.banks[1] || this.banks[0];
    const ctgBank = this.banks.find((b) => b.code === 'CTG') || this.banks[2] || this.banks[0];
    const vpbBank = this.banks.find((b) => b.code === 'VPB') || this.banks[4] || this.banks[0];
    const bidvBank = this.banks.find((b) => b.code === 'BIDV') || this.banks[3] || this.banks[0];
    const vcbBank = this.banks.find((b) => b.code === 'VCB') || this.banks[0];
    const acbBank = this.banks.find((b) => b.code === 'ACB') || this.banks[0];
    const tpbBank = this.banks.find((b) => b.code === 'TPB') || this.banks[0];

    // Seed Discovered URLs for each bank
    INITIAL_BANK_SEEDS.forEach((seed) => {
      const bank = this.banks.find((b) => b.code === seed.bank_code);
      if (bank) {
        seed.initial_discovered_urls.forEach((u) => {
          this.discoveredUrls.push({
            id: crypto.randomUUID(),
            bank_id: bank.id,
            bank_name: bank.name,
            url: u.url,
            page_title: u.page_title,
            classification: u.classification,
            relevance_score: u.relevance_score,
            reason: u.reason,
            status: u.status,
            discovered_at: new Date().toISOString(),
          });
        });
      }
    });

    // Seed Real Competitor Discovery Events across June, July, August, September 2026
    this.productDiscoveries = [
      // --- SEPTEMBER 2026 ---
      {
        id: 'disc-bidv-004',
        org_id: this.orgId,
        bank_id: bidvBank.id,
        bank_name: 'BIDV (BIDV Direct)',
        platform_name: 'BIDV Direct',
        product_name: 'BIDV Direct',
        feature_name: 'Nộp thuế hải quan điện tử thông quan 24/7',
        content_type: 'NEW_FEATURE',
        journey: 'B. TÀI KHOẢN & THANH TOÁN',
        benchmark_component_id: this.components.find((c) => c.name.includes('thuế'))?.id || null,
        benchmark_component_name: 'Nộp thuế / hải quan / hóa đơn',
        suggested_component: null,
        suggested_score: 3,
        suggested_description: 'Tích hợp kết nối Tổng cục Hải quan, hỗ trợ nộp thuế và thông quan tức thì 24/7.',
        mapping_status: 'MATCHED',
        change_summary: 'BIDV Direct tích hợp cổng thông quan tự động 24/7 với Tổng cục Hải quan.',
        newness: 'NEW',
        evidence: 'BIDV Direct cho phép nộp thuế xuất nhập khẩu và trừ nợ thuế tức thì không cần chờ giờ làm việc hành chính.',
        target_segment: 'CORPORATE',
        classification_confidence: 0.94,
        evidence_strength: 0.92,
        newness_confidence: 0.89,
        mapping_confidence: 0.93,
        source_reliability: 1.0,
        final_confidence: 0.93,
        published_at: '2026-09-05',
        detected_at: '2026-09-05',
        review_status: 'APPROVED_DISCOVERY',
        sources: [
          {
            id: 'src-bidv-001-web',
            crawl_content_id: 'cc-bidv-001-web',
            crawl_source_url: 'https://bidv.com.vn/vn/doanh-nghiep/',
            raw_href: 'https://bidv.com.vn/vn/doanh-nghiep/san-pham-dich-vu/ngan-hang-so/bidv-direct',
            resolved_url: 'https://bidv.com.vn/vn/doanh-nghiep/san-pham-dich-vu/ngan-hang-so/bidv-direct',
            final_url: 'https://bidv.com.vn/vn/doanh-nghiep/san-pham-dich-vu/ngan-hang-so/bidv-direct',
            content_url: 'https://bidv.com.vn/vn/doanh-nghiep/san-pham-dich-vu/ngan-hang-so/bidv-direct',
            url: 'https://bidv.com.vn/vn/doanh-nghiep/san-pham-dich-vu/ngan-hang-so/bidv-direct',
            url_validation_status: 'VALID',
            extraction_method: 'ANCHOR',
            source_type: 'website',
            type: 'website',
            title: 'Nộp thuế hải quan điện tử thông quan 24/7 qua BIDV Direct',
            evidence_text: 'Doanh nghiệp xuất nhập khẩu nộp thuế hải quan trực tuyến 24/7 và thông quan tự động tức thì trên BIDV Direct.',
            published_at: '2026-09-05',
          },
          {
            id: 'src-bidv-001-fb',
            crawl_content_id: 'cc-bidv-001-fb',
            crawl_source_url: 'https://www.facebook.com/BIDVbankvietnam',
            raw_href: 'https://www.facebook.com/BIDVbankvietnam/posts/pfbid0928XmN93817364a',
            resolved_url: 'https://www.facebook.com/BIDVbankvietnam/posts/pfbid0928XmN93817364a',
            final_url: 'https://www.facebook.com/BIDVbankvietnam/posts/pfbid0928XmN93817364a',
            content_url: 'https://www.facebook.com/BIDVbankvietnam/posts/pfbid0928XmN93817364a',
            url: 'https://www.facebook.com/BIDVbankvietnam/posts/pfbid0928XmN93817364a',
            url_validation_status: 'VALID',
            extraction_method: 'API_PERMALINK',
            source_type: 'facebook',
            type: 'facebook',
            title: 'Bài viết thông báo nộp thuế hải quan 24/7 trên Fanpage BIDV',
            evidence_text: 'BIDV phối hợp Tổng cục Hải quan hỗ trợ doanh nghiệp thông quan siêu tốc ngày nghỉ và lễ.',
            published_at: '2026-09-05',
          },
        ],
        source_count: 2,
        created_at: new Date().toISOString(),
      },
      {
        id: 'disc-vpb-003',
        org_id: this.orgId,
        bank_id: vpbBank.id,
        bank_name: 'VPBank NEOBiz',
        platform_name: 'VPBank NEOBiz',
        product_name: 'VPBank NEOBiz',
        feature_name: 'Gói ưu đãi 0 đồng phí chuyển tiền quốc tế SME',
        content_type: 'PROMOTION',
        journey: 'B. TÀI KHOẢN & THANH TOÁN',
        benchmark_component_id: this.components.find((c) => c.name.includes('quốc tế'))?.id || null,
        benchmark_component_name: 'Thanh toán quốc tế online',
        suggested_component: null,
        suggested_score: 2,
        suggested_description: 'Miễn 100% phí chuyển tiền quốc tế và ưu đãi tỷ giá FX đến hết quý 4/2026.',
        mapping_status: 'MATCHED',
        change_summary: 'Miễn phí chuyển tiền quốc tế và tặng gói bảo hiểm rủi ro tỷ giá cho doanh nghiệp SME xuất nhập khẩu.',
        newness: 'NEW',
        evidence: 'Từ nay đến 31/12/2026, VPBank NEOBiz áp dụng chính sách miễn 100% phí chuyển tiền quốc tế (OUR/SHA) cho khách hàng SME.',
        target_segment: 'SME',
        classification_confidence: 0.97,
        evidence_strength: 0.96,
        newness_confidence: 0.92,
        mapping_confidence: 0.95,
        source_reliability: 0.95,
        final_confidence: 0.95,
        published_at: '2026-09-04',
        detected_at: '2026-09-04',
        review_status: 'APPROVED_DISCOVERY',
        sources: [
          {
            id: 'src-vpb-003-fb',
            crawl_content_id: 'cc-vpb-003-fb',
            crawl_source_url: 'https://www.facebook.com/vpbank.sme',
            raw_href: 'https://www.facebook.com/vpbank.sme/posts/pfbid03Kx98NmZ9108Ls98a',
            resolved_url: 'https://www.facebook.com/vpbank.sme/posts/pfbid03Kx98NmZ9108Ls98a',
            final_url: 'https://www.facebook.com/vpbank.sme/posts/pfbid03Kx98NmZ9108Ls98a',
            content_url: 'https://www.facebook.com/vpbank.sme/posts/pfbid03Kx98NmZ9108Ls98a',
            url: 'https://www.facebook.com/vpbank.sme/posts/pfbid03Kx98NmZ9108Ls98a',
            url_validation_status: 'VALID',
            extraction_method: 'API_PERMALINK',
            source_type: 'facebook',
            type: 'facebook',
            title: 'Chương trình 0 đồng phí chuyển tiền quốc tế cho SME',
            evidence_text: 'VPBank SME công bố gói miễn phí điện chuyển tiền quốc tế và giảm 50 điểm cơ bản tỷ giá USD/EUR.',
            published_at: '2026-09-04',
          },
          {
            id: 'src-vpb-003-web',
            crawl_content_id: 'cc-vpb-003-web',
            crawl_source_url: 'https://www.vpbank.com.vn/doanh-nghiep',
            raw_href: 'https://www.vpbank.com.vn/doanh-nghiep/dich-vu-quoc-te/chuyen-tien-quoc-te-online',
            resolved_url: 'https://www.vpbank.com.vn/doanh-nghiep/dich-vu-quoc-te/chuyen-tien-quoc-te-online',
            final_url: 'https://www.vpbank.com.vn/doanh-nghiep/dich-vu-quoc-te/chuyen-tien-quoc-te-online',
            content_url: 'https://www.vpbank.com.vn/doanh-nghiep/dich-vu-quoc-te/chuyen-tien-quoc-te-online',
            url: 'https://www.vpbank.com.vn/doanh-nghiep/dich-vu-quoc-te/chuyen-tien-quoc-te-online',
            url_validation_status: 'VALID',
            extraction_method: 'ANCHOR',
            source_type: 'website',
            type: 'website',
            title: 'Dịch vụ chuyển tiền quốc tế online VPBank NEOBiz',
            evidence_text: 'Chi tiết biểu phí ưu đãi 0 đồng chuyển tiền quốc tế trên ứng dụng VPBank NEOBiz.',
            published_at: '2026-09-04',
          },
        ],
        source_count: 2,
        created_at: new Date().toISOString(),
      },
      {
        id: 'disc-tcb-001',
        org_id: this.orgId,
        bank_id: tcbBank.id,
        bank_name: 'Techcombank Business',
        platform_name: 'Techcombank Business',
        product_name: 'Techcombank Business',
        feature_name: 'Đặt lịch chuyển tiền tương lai & định kỳ',
        content_type: 'NEW_FEATURE',
        journey: 'B. TÀI KHOẢN & THANH TOÁN',
        benchmark_component_id: this.components.find((c) => c.name.includes('Chuyển tiền'))?.id || null,
        benchmark_component_name: 'Chuyển tiền 24/7 & theo lô',
        suggested_component: null,
        suggested_score: 3,
        suggested_description: 'Hỗ trợ đặt lịch chuyển tiền đơn & theo lô trong tương lai, tự động thực thi 24/7.',
        mapping_status: 'MATCHED',
        change_summary: 'Bổ sung khả năng đặt lịch chuyển tiền trong tương lai và định kỳ trên nền tảng Techcombank Business.',
        newness: 'NEW',
        evidence: 'Khách hàng doanh nghiệp hiện có thể chủ động đặt lịch chuyển tiền trong tương lai hoặc cài đặt lịch định kỳ trên Techcombank Business với hạn mức lên đến 20 tỷ đồng/giao dịch.',
        target_segment: 'BUSINESS',
        classification_confidence: 0.96,
        evidence_strength: 0.95,
        newness_confidence: 0.92,
        mapping_confidence: 0.94,
        source_reliability: 1.0,
        final_confidence: 0.96,
        published_at: '2026-09-02',
        detected_at: '2026-09-03',
        review_status: 'APPROVED_DISCOVERY',
        sources: [
          {
            id: 'src-tcb-001-web',
            crawl_content_id: 'cc-tcb-001-web',
            crawl_source_url: 'https://techcombank.com/ho-kinh-doanh-va-doanh-nghiep-nho/doanh-nghiep-nho',
            raw_href: '/lp/techcombank-business-phien-ban-vuot-troi',
            resolved_url: 'https://techcombank.com/lp/techcombank-business-phien-ban-vuot-troi',
            final_url: 'https://techcombank.com/lp/techcombank-business-phien-ban-vuot-troi',
            content_url: 'https://techcombank.com/lp/techcombank-business-phien-ban-vuot-troi',
            url: 'https://techcombank.com/lp/techcombank-business-phien-ban-vuot-troi',
            url_validation_status: 'VALID',
            extraction_method: 'ANCHOR',
            source_type: 'website',
            type: 'website',
            title: 'Techcombank Business Phiên Bản Vượt Trội - Đặt Lịch Chuyển Tiền',
            evidence_text: 'Techcombank Business nâng cấp tính năng đặt lịch chuyển tiền trong tương lai và định kỳ cho doanh nghiệp vừa và nhỏ.',
            published_at: '2026-09-02',
          },
          {
            id: 'src-tcb-001-fb',
            crawl_content_id: 'cc-tcb-001-fb',
            crawl_source_url: 'https://www.facebook.com/Techcombank',
            raw_href: 'https://www.facebook.com/photo/?fbid=1538994078269924&set=a.639370634898944',
            resolved_url: 'https://www.facebook.com/photo/?fbid=1538994078269924&set=a.639370634898944',
            final_url: 'https://www.facebook.com/photo/?fbid=1538994078269924&set=a.639370634898944',
            content_url: 'https://www.facebook.com/photo/?fbid=1538994078269924&set=a.639370634898944',
            url: 'https://www.facebook.com/photo/?fbid=1538994078269924&set=a.639370634898944',
            url_validation_status: 'VALID',
            extraction_method: 'DOM_PERMALINK',
            source_type: 'facebook',
            type: 'facebook',
            title: 'Hình ảnh ra mắt tính năng đặt lịch chuyển tiền Techcombank Business',
            evidence_text: 'Quản lý lịch thanh toán tự động tới 20 tỷ/lệnh trên Techcombank Business.',
            published_at: '2026-09-03',
          },
        ],
        source_count: 2,
        created_at: new Date().toISOString(),
      },
      {
        id: 'disc-ctg-002',
        org_id: this.orgId,
        bank_id: ctgBank.id,
        bank_name: 'VietinBank eFAST',
        platform_name: 'VietinBank eFAST',
        product_name: 'VietinBank eFAST',
        feature_name: 'Ký số hợp đồng tín dụng & văn kiện online',
        content_type: 'NEW_FEATURE',
        journey: 'D. TÍN DỤNG',
        benchmark_component_id: this.components.find((c) => c.name.includes('hạn mức') || c.name.includes('Giải ngân'))?.id || null,
        benchmark_component_name: 'Cấp hạn mức',
        suggested_component: 'Ký kết văn kiện tín dụng',
        suggested_score: 3,
        suggested_description: 'Ký số văn kiện tín dụng và phụ lục giải ngân trực tuyến hoàn toàn qua VietinBank eFAST.',
        mapping_status: 'NEW_COMPONENT_SUGGESTED',
        change_summary: 'VietinBank eFAST triển khai ký số trực tuyến hợp đồng tín dụng không cần đến quầy.',
        newness: 'NEW',
        evidence: 'Doanh nghiệp thực hiện ký số chứng thư số bảo mật hợp đồng tín dụng và nhận giải ngân siêu tốc trong 2 giờ.',
        target_segment: 'BUSINESS',
        classification_confidence: 0.95,
        evidence_strength: 0.94,
        newness_confidence: 0.91,
        mapping_confidence: 0.93,
        source_reliability: 0.95,
        final_confidence: 0.94,
        published_at: '2026-09-01',
        detected_at: '2026-09-02',
        review_status: 'APPROVED_DISCOVERY',
        sources: [
          {
            id: 'src-ctg-002-web',
            crawl_content_id: 'cc-ctg-002-web',
            crawl_source_url: 'https://www.vietinbank.vn/doanh-nghiep',
            raw_href: 'https://www.vietinbank.vn/vn/doanh-nghiep/ngan-hang-so/efast/ky-so-online.html',
            resolved_url: 'https://www.vietinbank.vn/vn/doanh-nghiep/ngan-hang-so/efast/ky-so-online.html',
            final_url: 'https://www.vietinbank.vn/vn/doanh-nghiep/ngan-hang-so/efast/ky-so-online.html',
            content_url: 'https://www.vietinbank.vn/vn/doanh-nghiep/ngan-hang-so/efast/ky-so-online.html',
            url: 'https://www.vietinbank.vn/vn/doanh-nghiep/ngan-hang-so/efast/ky-so-online.html',
            url_validation_status: 'VALID',
            extraction_method: 'ANCHOR',
            source_type: 'website',
            type: 'website',
            title: 'Ký số hợp đồng tín dụng trực tuyến VietinBank eFAST',
            evidence_text: 'Số hóa 100% quy trình ký kết và giải ngân khoản vay không cần đến quầy.',
            published_at: '2026-09-01',
          },
          {
            id: 'src-ctg-002-fb',
            crawl_content_id: 'cc-ctg-002-fb',
            crawl_source_url: 'https://www.facebook.com/VietinBank.vn',
            raw_href: 'https://www.facebook.com/VietinBank.vn/posts/pfbid04Yx8NmK29sL09a8Z',
            resolved_url: 'https://www.facebook.com/VietinBank.vn/posts/pfbid04Yx8NmK29sL09a8Z',
            final_url: 'https://www.facebook.com/VietinBank.vn/posts/pfbid04Yx8NmK29sL09a8Z',
            content_url: 'https://www.facebook.com/VietinBank.vn/posts/pfbid04Yx8NmK29sL09a8Z',
            url: 'https://www.facebook.com/VietinBank.vn/posts/pfbid04Yx8NmK29sL09a8Z',
            url_validation_status: 'VALID',
            extraction_method: 'API_PERMALINK',
            source_type: 'facebook',
            type: 'facebook',
            title: 'Thông báo triển khai ký số tín dụng eFAST trên Facebook',
            evidence_text: 'Giải pháp ký số bảo mật chứng thư số công cộng cho khách hàng doanh nghiệp.',
            published_at: '2026-09-01',
          },
        ],
        source_count: 2,
        created_at: new Date().toISOString(),
      },
      {
        id: 'disc-tpb-005',
        org_id: this.orgId,
        bank_id: tpbBank.id,
        bank_name: 'TPBank Biz',
        platform_name: 'TPBank Biz',
        product_name: 'TPBank Biz',
        feature_name: 'Nâng cấp hạn mức chuyển tiền trực tuyến lên 50 tỷ',
        content_type: 'ENHANCEMENT',
        journey: 'B. TÀI KHOẢN & THANH TOÁN',
        benchmark_component_id: this.components.find((c) => c.name.includes('Chuyển tiền'))?.id || null,
        benchmark_component_name: 'Chuyển tiền 24/7 & theo lô',
        suggested_component: null,
        suggested_score: 2,
        suggested_description: 'Hạn mức giao dịch chuyển tiền trực tuyến tăng từ 20 tỷ lên 50 tỷ/ngày.',
        mapping_status: 'MATCHED',
        change_summary: 'Nâng cấp trần hạn mức chuyển tiền một lệnh và theo ngày trên TPBank Biz.',
        newness: 'UPDATED',
        evidence: 'TPBank nâng cấp giới hạn giao dịch ngân hàng số doanh nghiệp lên 50 tỷ VNĐ/ngày cho gói dịch vụ Doanh nghiệp Pro.',
        target_segment: 'BUSINESS',
        classification_confidence: 0.86,
        evidence_strength: 0.84,
        newness_confidence: 0.80,
        mapping_confidence: 0.88,
        source_reliability: 0.95,
        final_confidence: 0.82,
        published_at: '2026-09-06',
        detected_at: '2026-09-06',
        review_status: 'NEEDS_REVIEW',
        review_reason: 'HAS_UNVERIFIED_OR_BROKEN_SOURCE',
        sources: [
          {
            id: 'src-tpb-005-web',
            crawl_content_id: 'cc-tpb-005-web',
            crawl_source_url: 'https://tpb.vn/doanh-nghiep',
            raw_href: 'https://tpb.vn/khach-hang-doanh-nghiep/ebank-biz/ngan-hang-dien-tu-ebank-biz/nang-cap-han-muc-50ty',
            resolved_url: 'https://tpb.vn/khach-hang-doanh-nghiep/ebank-biz/ngan-hang-dien-tu-ebank-biz/nang-cap-han-muc-50ty',
            final_url: 'https://tpb.vn/khach-hang-doanh-nghiep/ebank-biz/ngan-hang-dien-tu-ebank-biz/nang-cap-han-muc-50ty',
            content_url: 'https://tpb.vn/khach-hang-doanh-nghiep/ebank-biz/ngan-hang-dien-tu-ebank-biz/nang-cap-han-muc-50ty',
            url: 'https://tpb.vn/khach-hang-doanh-nghiep/ebank-biz/ngan-hang-dien-tu-ebank-biz/nang-cap-han-muc-50ty',
            url_validation_status: 'VALID',
            extraction_method: 'ANCHOR',
            source_type: 'website',
            type: 'website',
            title: 'TPBank Biz nâng trần hạn mức chuyển tiền doanh nghiệp',
            evidence_text: 'Hạn mức giao dịch chuyển khoản trực tuyến 50 tỷ đồng/ngày cho gói Doanh nghiệp Pro.',
            published_at: '2026-09-06',
          },
          {
            id: 'src-tpb-005-fb',
            crawl_content_id: 'cc-tpb-005-fb',
            crawl_source_url: 'https://www.facebook.com/TPBank',
            raw_href: null,
            resolved_url: null,
            final_url: null,
            content_url: '',
            exact_content_url: '',
            url: '',
            url_validation_status: 'MISSING',
            url_validation_reason: 'MISSING_FACEBOOK_PERMALINK',
            extraction_method: 'API_PERMALINK',
            source_type: 'facebook',
            type: 'facebook',
            title: 'Bài viết nâng cấp hạn mức TPBank Biz',
            evidence_text: 'TPBank thông báo mở rộng hạn mức giao dịch trực tuyến cho doanh nghiệp lớn.',
            published_at: '2026-09-06',
          },
        ],
        source_count: 2,
        created_at: new Date().toISOString(),
      },

      // --- AUGUST 2026 ---
      {
        id: 'disc-bidv-012',
        org_id: this.orgId,
        bank_id: bidvBank.id,
        bank_name: 'BIDV (BIDV Direct)',
        platform_name: 'BIDV Direct',
        product_name: 'BIDV Direct',
        feature_name: 'Mua bán ngoại tệ trực tuyến FX Online khớp lệnh tức thì',
        content_type: 'NEW_FEATURE',
        journey: 'C. TÀI TRỢ THƯƠNG MẠI',
        benchmark_component_id: this.components.find((c) => c.name.includes('ngoại tệ'))?.id || null,
        benchmark_component_name: 'Mua bán ngoại tệ online',
        suggested_component: null,
        suggested_score: 3,
        suggested_description: 'Ra mắt cổng giao dịch ngoại tệ trực tuyến BIDV iFX khớp lệnh tức thì tỷ giá ưu đãi.',
        mapping_status: 'MATCHED',
        change_summary: 'BIDV Direct cho phép mua bán ngoại tệ kỳ hạn và giao ngay với tỷ giá cập nhật real-time.',
        newness: 'NEW',
        evidence: 'Doanh nghiệp xuất nhập khẩu chủ động chốt tỷ giá ngoại tệ trực tuyến 24/7 trên BIDV Direct không cần đến quầy.',
        target_segment: 'CORPORATE',
        classification_confidence: 0.95,
        evidence_strength: 0.94,
        newness_confidence: 0.92,
        mapping_confidence: 0.94,
        source_reliability: 1.0,
        final_confidence: 0.94,
        published_at: '2026-08-10',
        detected_at: '2026-08-10',
        review_status: 'APPROVED_DISCOVERY',
        sources: [
          {
            id: 'src-bidv-012-web',
            crawl_content_id: 'cc-bidv-012-web',
            exact_content_url: 'https://bidv.com.vn/vn/doanh-nghiep/san-pham-dich-vu/ngan-hang-so/bidv-ifx-online',
            content_url: 'https://bidv.com.vn/vn/doanh-nghiep/san-pham-dich-vu/ngan-hang-so/bidv-ifx-online',
            url: 'https://bidv.com.vn/vn/doanh-nghiep/san-pham-dich-vu/ngan-hang-so/bidv-ifx-online',
            url_validation_status: 'VALID',
            source_type: 'website',
            type: 'website',
            title: 'Cổng giao dịch ngoại tệ trực tuyến BIDV iFX',
            evidence_text: 'Khớp lệnh mua bán ngoại tệ giao ngay và kỳ hạn 24/7 với tỷ giá cạnh tranh.',
            published_at: '2026-08-10',
          },
          {
            id: 'src-bidv-012-fb',
            crawl_content_id: 'cc-bidv-012-fb',
            exact_content_url: 'https://www.facebook.com/photo/?fbid=948392019384729&set=a.582910394829102',
            content_url: 'https://www.facebook.com/photo/?fbid=948392019384729&set=a.582910394829102',
            url: 'https://www.facebook.com/photo/?fbid=948392019384729&set=a.582910394829102',
            url_validation_status: 'VALID',
            source_type: 'facebook',
            type: 'facebook',
            title: 'Poster ra mắt BIDV iFX trên Fanpage',
            evidence_text: 'Chốt tỷ giá FX tức thì và chuyển tiền quốc tế trọn gói qua BIDV Direct.',
            published_at: '2026-08-10',
          },
        ],
        source_count: 2,
        created_at: new Date().toISOString(),
      },
      {
        id: 'disc-tcb-013',
        org_id: this.orgId,
        bank_id: tcbBank.id,
        bank_name: 'Techcombank Business',
        platform_name: 'Techcombank Business',
        product_name: 'Techcombank Business',
        feature_name: 'Báo cáo dòng tiền thông minh Cashflow AI',
        content_type: 'NEW_FEATURE',
        journey: 'B. TÀI KHOẢN & THANH TOÁN',
        benchmark_component_id: this.components.find((c) => c.name.includes('báo cáo') || c.name.includes('dòng tiền'))?.id || null,
        benchmark_component_name: 'Quản lý dòng tiền & báo cáo',
        suggested_component: null,
        suggested_score: 3,
        suggested_description: 'Công cụ phân tích và dự báo dòng tiền doanh nghiệp tự động bằng AI.',
        mapping_status: 'MATCHED',
        change_summary: 'Techcombank Business tích hợp báo cáo phân tích thu chi và dự báo dòng tiền thông minh bằng AI.',
        newness: 'NEW',
        evidence: 'Tính năng Cashflow AI hỗ trợ CEO/CFO dự báo hụt dòng tiền và tối ưu vốn lưu động theo thời gian thực.',
        target_segment: 'BUSINESS',
        classification_confidence: 0.96,
        evidence_strength: 0.95,
        newness_confidence: 0.93,
        mapping_confidence: 0.95,
        source_reliability: 1.0,
        final_confidence: 0.95,
        published_at: '2026-08-19',
        detected_at: '2026-08-19',
        review_status: 'APPROVED_DISCOVERY',
        sources: [
          {
            id: 'src-tcb-013-web',
            crawl_content_id: 'cc-tcb-013-web',
            exact_content_url: 'https://techcombank.com/ho-kinh-doanh-va-doanh-nghiep-nho/doanh-nghiep-nho/ngan-hang-so/techcombank-business/cashflow-ai',
            content_url: 'https://techcombank.com/ho-kinh-doanh-va-doanh-nghiep-nho/doanh-nghiep-nho/ngan-hang-so/techcombank-business/cashflow-ai',
            url: 'https://techcombank.com/ho-kinh-doanh-va-doanh-nghiep-nho/doanh-nghiep-nho/ngan-hang-so/techcombank-business/cashflow-ai',
            url_validation_status: 'VALID',
            source_type: 'website',
            type: 'website',
            title: 'Phân hệ Cashflow AI trên Techcombank Business',
            evidence_text: 'Công cụ quản trị và dự báo dòng tiền thông minh hỗ trợ doanh nghiệp tối ưu nguồn vốn lưu động.',
            published_at: '2026-08-19',
          },
          {
            id: 'src-tcb-013-fb',
            crawl_content_id: 'cc-tcb-013-fb',
            exact_content_url: 'https://www.facebook.com/Techcombank/posts/pfbid039XmN82736451a',
            content_url: 'https://www.facebook.com/Techcombank/posts/pfbid039XmN82736451a',
            url: 'https://www.facebook.com/Techcombank/posts/pfbid039XmN82736451a',
            url_validation_status: 'VALID',
            source_type: 'facebook',
            type: 'facebook',
            title: 'Video giới thiệu Cashflow AI Techcombank Business',
            evidence_text: 'Quản trị dòng tiền doanh nghiệp thông minh và chủ động cùng Techcombank Business.',
            published_at: '2026-08-19',
          },
        ],
        source_count: 2,
        created_at: new Date().toISOString(),
      },
      {
        id: 'disc-acb-014',
        org_id: this.orgId,
        bank_id: acbBank.id,
        bank_name: 'ACB ONE BIZ',
        platform_name: 'ACB ONE BIZ',
        product_name: 'ACB ONE BIZ',
        feature_name: 'Chuyển tiền quốc tế trực tuyến 24/7 không cần nộp hồ sơ giấy',
        content_type: 'NEW_FEATURE',
        journey: 'B. TÀI KHOẢN & THANH TOÁN',
        benchmark_component_id: this.components.find((c) => c.name.includes('quốc tế'))?.id || null,
        benchmark_component_name: 'Thanh toán quốc tế online',
        suggested_component: null,
        suggested_score: 3,
        suggested_description: 'Nộp chứng từ chuyển tiền quốc tế trực tuyến 100%, duyệt điện chuyển tiền trong 1 giờ.',
        mapping_status: 'MATCHED',
        change_summary: 'ACB ONE BIZ số hóa toàn diện quy trình thanh toán quốc tế và chuyển tiền xuyên biên giới.',
        newness: 'NEW',
        evidence: 'Khách hàng SME upload bộ chứng từ hợp đồng số và nhận mã điện MT103 qua email trong 60 phút.',
        target_segment: 'SME',
        classification_confidence: 0.94,
        evidence_strength: 0.93,
        newness_confidence: 0.91,
        mapping_confidence: 0.93,
        source_reliability: 0.95,
        final_confidence: 0.93,
        published_at: '2026-08-27',
        detected_at: '2026-08-27',
        review_status: 'APPROVED_DISCOVERY',
        sources: [
          {
            id: 'src-acb-014-web',
            crawl_content_id: 'cc-acb-014-web',
            exact_content_url: 'https://acb.com.vn/doanh-nghiep-giai-phap-thanh-toan/acb-one-biz/chuyen-tien-quoc-te-online',
            content_url: 'https://acb.com.vn/doanh-nghiep-giai-phap-thanh-toan/acb-one-biz/chuyen-tien-quoc-te-online',
            url: 'https://acb.com.vn/doanh-nghiep-giai-phap-thanh-toan/acb-one-biz/chuyen-tien-quoc-te-online',
            url_validation_status: 'VALID',
            source_type: 'website',
            type: 'website',
            title: 'Chuyển tiền quốc tế online 24/7 ACB ONE BIZ',
            evidence_text: 'Nộp chứng từ trực tuyến 100%, nhận mã điện MT103 trong 60 phút.',
            published_at: '2026-08-27',
          },
          {
            id: 'src-acb-014-fb',
            crawl_content_id: 'cc-acb-014-fb',
            exact_content_url: 'https://www.facebook.com/photo/?fbid=129384758392019&set=a.684920194829103',
            content_url: 'https://www.facebook.com/photo/?fbid=129384758392019&set=a.684920194829103',
            url: 'https://www.facebook.com/photo/?fbid=129384758392019&set=a.684920194829103',
            url_validation_status: 'VALID',
            source_type: 'facebook',
            type: 'facebook',
            title: 'Poster chuyển tiền quốc tế trực tuyến ACB',
            evidence_text: 'Thanh toán quốc tế không giấy tờ cùng ACB ONE BIZ.',
            published_at: '2026-08-27',
          },
        ],
        source_count: 2,
        created_at: new Date().toISOString(),
      },

      // --- JULY 2026 ---
      {
        id: 'disc-vpb-009',
        org_id: this.orgId,
        bank_id: vpbBank.id,
        bank_name: 'VPBank NEOBiz',
        platform_name: 'VPBank NEOBiz',
        product_name: 'VPBank NEOBiz',
        feature_name: 'Thấu chi online không tài sản bảo đảm hạn mức 5 tỷ',
        content_type: 'NEW_FEATURE',
        journey: 'D. TÍN DỤNG',
        benchmark_component_id: this.components.find((c) => c.name.includes('hạn mức') || c.name.includes('Giải ngân'))?.id || null,
        benchmark_component_name: 'Cấp hạn mức',
        suggested_component: null,
        suggested_score: 3,
        suggested_description: 'Cấp hạn mức thấu chi vốn lưu động tín chấp online tới 5 tỷ đồng duyệt siêu tốc.',
        mapping_status: 'MATCHED',
        change_summary: 'VPBank NEOBiz kích hoạt hạn mức vốn lưu động thấu chi doanh nghiệp phê duyệt tự động bằng dữ liệu giao dịch.',
        newness: 'NEW',
        evidence: 'Doanh nghiệp SME được cấp hạn mức thấu chi lên tới 5 tỷ đồng trong 5 phút từ dữ liệu sao kê tài khoản ngân hàng.',
        target_segment: 'SME',
        classification_confidence: 0.96,
        evidence_strength: 0.95,
        newness_confidence: 0.92,
        mapping_confidence: 0.95,
        source_reliability: 0.95,
        final_confidence: 0.95,
        published_at: '2026-07-08',
        detected_at: '2026-07-08',
        review_status: 'APPROVED_DISCOVERY',
        sources: [
          {
            id: 'src-vpb-009-web',
            crawl_content_id: 'cc-vpb-009-web',
            exact_content_url: 'https://www.vpbank.com.vn/doanh-nghiep/tin-dung/thau-chi-online-sme',
            content_url: 'https://www.vpbank.com.vn/doanh-nghiep/tin-dung/thau-chi-online-sme',
            url: 'https://www.vpbank.com.vn/doanh-nghiep/tin-dung/thau-chi-online-sme',
            url_validation_status: 'VALID',
            source_type: 'website',
            type: 'website',
            title: 'Thấu chi tín chấp online doanh nghiệp VPBank',
            evidence_text: 'Phê duyệt hạn mức thấu chi vốn lưu động trực tuyến tới 5 tỷ đồng.',
            published_at: '2026-07-08',
          },
          {
            id: 'src-vpb-009-fb',
            crawl_content_id: 'cc-vpb-009-fb',
            exact_content_url: 'https://www.facebook.com/photo/?fbid=847291049281726&set=a.193847291049281',
            content_url: 'https://www.facebook.com/photo/?fbid=847291049281726&set=a.193847291049281',
            url: 'https://www.facebook.com/photo/?fbid=847291049281726&set=a.193847291049281',
            url_validation_status: 'VALID',
            source_type: 'facebook',
            type: 'facebook',
            title: 'Thông báo cấp vốn thấu chi siêu tốc trên Facebook',
            evidence_text: 'VPBank SME mở rộng hạn mức thấu chi tín chấp online phê duyệt tự động.',
            published_at: '2026-07-08',
          },
        ],
        source_count: 2,
        created_at: new Date().toISOString(),
      },
      {
        id: 'disc-ctg-010',
        org_id: this.orgId,
        bank_id: ctgBank.id,
        bank_name: 'VietinBank eFAST',
        platform_name: 'VietinBank eFAST',
        product_name: 'VietinBank eFAST',
        feature_name: 'Mở tài khoản số đẹp online qua eKYC doanh nghiệp',
        content_type: 'NEW_FEATURE',
        journey: 'A. ONBOARDING',
        benchmark_component_id: this.components.find((c) => c.name.includes('Mở TK'))?.id || null,
        benchmark_component_name: 'Mở TK online',
        suggested_component: null,
        suggested_score: 3,
        suggested_description: 'Mở tài khoản thanh toán số đẹp chọn số online 100% qua eKYC và kích hoạt ngay trong ngày.',
        mapping_status: 'MATCHED',
        change_summary: 'VietinBank triển khai mở tài khoản trực tuyến 100% cho người đại diện pháp luật doanh nghiệp.',
        newness: 'NEW',
        evidence: 'Doanh nghiệp có thể chọn số tài khoản theo phong thủy/ngày thành lập và giao dịch ngay không cần ra chi nhánh.',
        target_segment: 'BUSINESS',
        classification_confidence: 0.95,
        evidence_strength: 0.93,
        newness_confidence: 0.90,
        mapping_confidence: 0.94,
        source_reliability: 0.95,
        final_confidence: 0.94,
        published_at: '2026-07-16',
        detected_at: '2026-07-16',
        review_status: 'APPROVED_DISCOVERY',
        sources: [
          {
            id: 'src-ctg-010-web',
            crawl_content_id: 'cc-ctg-010-web',
            exact_content_url: 'https://www.vietinbank.vn/vn/doanh-nghiep/tai-khoan-va-tien-gui/mo-tai-khoan-ekyc.html',
            content_url: 'https://www.vietinbank.vn/vn/doanh-nghiep/tai-khoan-va-tien-gui/mo-tai-khoan-ekyc.html',
            url: 'https://www.vietinbank.vn/vn/doanh-nghiep/tai-khoan-va-tien-gui/mo-tai-khoan-ekyc.html',
            url_validation_status: 'VALID',
            source_type: 'website',
            type: 'website',
            title: 'Mở tài khoản doanh nghiệp online eKYC VietinBank',
            evidence_text: 'Đăng ký và kích hoạt tài khoản thanh toán số đẹp doanh nghiệp online trong ngày.',
            published_at: '2026-07-16',
          },
          {
            id: 'src-ctg-010-fb',
            crawl_content_id: 'cc-ctg-010-fb',
            exact_content_url: 'https://www.facebook.com/photo/?fbid=1092837492817263&set=a.483920194827101',
            content_url: 'https://www.facebook.com/photo/?fbid=1092837492817263&set=a.483920194827101',
            url: 'https://www.facebook.com/photo/?fbid=1092837492817263&set=a.483920194827101',
            url_validation_status: 'VALID',
            source_type: 'facebook',
            type: 'facebook',
            title: 'Hình ảnh chiến dịch mở tài khoản số đẹp VietinBank eFAST',
            evidence_text: 'Chọn số tài khoản tài lộc và giao dịch tức thì trên VietinBank eFAST.',
            published_at: '2026-07-16',
          },
        ],
        source_count: 2,
        created_at: new Date().toISOString(),
      },
      {
        id: 'disc-bidv-011',
        org_id: this.orgId,
        bank_id: bidvBank.id,
        bank_name: 'BIDV (BIDV Direct)',
        platform_name: 'BIDV Direct',
        product_name: 'BIDV Direct',
        feature_name: 'Gói giải pháp tài trợ chuỗi cung ứng số SCF',
        content_type: 'NEW_PRODUCT',
        journey: 'C. TÀI TRỢ THƯƠNG MẠI',
        benchmark_component_id: this.components.find((c) => c.name.includes('chuỗi'))?.id || null,
        benchmark_component_name: 'Tài trợ chuỗi cung ứng',
        suggested_component: null,
        suggested_score: 2,
        suggested_description: 'Nền tảng tài trợ chuỗi cung ứng số kết nối nhà phân phối và nhà cung ứng.',
        mapping_status: 'MATCHED',
        change_summary: 'BIDV Direct ra mắt phân hệ Supply Chain Finance cho các chuỗi bán lẻ và sản xuất lớn.',
        newness: 'NEW',
        evidence: 'Giải pháp tài trợ hóa đơn và chiết khấu thanh toán sớm dành cho mạng lưới đại lý liên kết.',
        target_segment: 'CORPORATE',
        classification_confidence: 0.88,
        evidence_strength: 0.85,
        newness_confidence: 0.82,
        mapping_confidence: 0.87,
        source_reliability: 0.95,
        final_confidence: 0.85,
        published_at: '2026-07-25',
        detected_at: '2026-07-25',
        review_status: 'NEEDS_REVIEW',
        sources: [
          {
            id: 'src-bidv-011-web',
            crawl_content_id: 'cc-bidv-011-web',
            exact_content_url: 'https://bidv.com.vn/vn/doanh-nghiep/san-pham-dich-vu/tai-tro-chuoi-cung-ung-scf',
            content_url: 'https://bidv.com.vn/vn/doanh-nghiep/san-pham-dich-vu/tai-tro-chuoi-cung-ung-scf',
            url: 'https://bidv.com.vn/vn/doanh-nghiep/san-pham-dich-vu/tai-tro-chuoi-cung-ung-scf',
            url_validation_status: 'VALID',
            source_type: 'website',
            type: 'website',
            title: 'Tài trợ chuỗi cung ứng số BIDV SCF',
            evidence_text: 'Tài trợ hóa đơn và chiết khấu thanh toán sớm trên nền tảng số BIDV.',
            published_at: '2026-07-25',
          },
          {
            id: 'src-bidv-011-fb',
            crawl_content_id: 'cc-bidv-011-fb',
            exact_content_url: 'https://www.facebook.com/BIDVbankvietnam/posts/pfbid028XmN81726354c',
            content_url: 'https://www.facebook.com/BIDVbankvietnam/posts/pfbid028XmN81726354c',
            url: 'https://www.facebook.com/BIDVbankvietnam/posts/pfbid028XmN81726354c',
            url_validation_status: 'VALID',
            source_type: 'facebook',
            type: 'facebook',
            title: 'Giới thiệu giải pháp chuỗi cung ứng BIDV SCF',
            evidence_text: 'Hỗ trợ đại lý liên kết tiếp cận nguồn vốn lưu động nhanh chóng.',
            published_at: '2026-07-25',
          },
        ],
        source_count: 2,
        created_at: new Date().toISOString(),
      },

      // --- JUNE 2026 ---
      {
        id: 'disc-vcb-006',
        org_id: this.orgId,
        bank_id: vcbBank.id,
        bank_name: 'Vietcombank',
        platform_name: 'VCB DigiBiz',
        product_name: 'VCB DigiBiz',
        feature_name: 'VCB CashUp: Quản lý dòng tiền đa tài khoản & thanh toán tập trung',
        content_type: 'NEW_FEATURE',
        journey: 'B. TÀI KHOẢN & THANH TOÁN',
        benchmark_component_id: this.components.find((c) => c.name.includes('báo cáo') || c.name.includes('dòng tiền'))?.id || null,
        benchmark_component_name: 'Quản lý dòng tiền & báo cáo',
        suggested_component: null,
        suggested_score: 3,
        suggested_description: 'Hệ thống quản trị dòng tiền tập trung tự động điều vốn giữa các tài khoản công ty mẹ - con.',
        mapping_status: 'MATCHED',
        change_summary: 'Vietcombank ra mắt phân hệ VCB CashUp tích hợp trên VCB DigiBiz cho doanh nghiệp đa chi nhánh.',
        newness: 'NEW',
        evidence: 'VCB CashUp giúp doanh nghiệp tự động quét gom số dư tài khoản về tài khoản chính và phân bổ vốn thanh toán.',
        target_segment: 'CORPORATE',
        classification_confidence: 0.97,
        evidence_strength: 0.96,
        newness_confidence: 0.94,
        mapping_confidence: 0.96,
        source_reliability: 1.0,
        final_confidence: 0.96,
        published_at: '2026-06-12',
        detected_at: '2026-06-12',
        review_status: 'APPROVED_DISCOVERY',
        sources: [
          {
            id: 'src-vcb-006-web',
            crawl_content_id: 'cc-vcb-006-web',
            exact_content_url: 'https://vietcombank.com.vn/vi-VN/To-chuc/SMEs/Gi%E1%BA%A3i-ph%C3%A1p/KHTC-SME---Ngan-hang-so/KHTC---VCB-DigiBiz/vcb-cashup',
            content_url: 'https://vietcombank.com.vn/vi-VN/To-chuc/SMEs/Gi%E1%BA%A3i-ph%C3%A1p/KHTC-SME---Ngan-hang-so/KHTC---VCB-DigiBiz/vcb-cashup',
            url: 'https://vietcombank.com.vn/vi-VN/To-chuc/SMEs/Gi%E1%BA%A3i-ph%C3%A1p/KHTC-SME---Ngan-hang-so/KHTC---VCB-DigiBiz/vcb-cashup',
            url_validation_status: 'VALID',
            source_type: 'website',
            type: 'website',
            title: 'Phân hệ quản trị dòng tiền VCB CashUp',
            evidence_text: 'Hệ thống quét gom và phân bổ số dư tự động đa tài khoản công ty mẹ con.',
            published_at: '2026-06-12',
          },
          {
            id: 'src-vcb-006-fb',
            crawl_content_id: 'cc-vcb-006-fb',
            exact_content_url: 'https://www.facebook.com/ilovevcb/posts/pfbid083YmN98273645x',
            content_url: 'https://www.facebook.com/ilovevcb/posts/pfbid083YmN98273645x',
            url: 'https://www.facebook.com/ilovevcb/posts/pfbid083YmN98273645x',
            url_validation_status: 'VALID',
            source_type: 'facebook',
            type: 'facebook',
            title: 'Thông báo ra mắt VCB CashUp trên Fanpage',
            evidence_text: 'Giải pháp nâng cao hiệu quả sử dụng vốn lưu động cho doanh nghiệp vừa và lớn.',
            published_at: '2026-06-12',
          },
        ],
        source_count: 2,
        created_at: new Date().toISOString(),
      },
      {
        id: 'disc-acb-007',
        org_id: this.orgId,
        bank_id: acbBank.id,
        bank_name: 'ACB ONE BIZ',
        platform_name: 'ACB ONE BIZ',
        product_name: 'ACB ONE BIZ',
        feature_name: 'Chi lương tự động kết nối API phần mềm kế toán MISA/Fast',
        content_type: 'NEW_FEATURE',
        journey: 'B. TÀI KHOẢN & THANH TOÁN',
        benchmark_component_id: this.components.find((c) => c.name.includes('lương') || c.name.includes('lô'))?.id || null,
        benchmark_component_name: 'Chuyển tiền 24/7 & theo lô',
        suggested_component: null,
        suggested_score: 3,
        suggested_description: 'Chi lương trực tiếp từ phần mềm kế toán ERP/MISA qua Open API ACB không cần xuất file Excel.',
        mapping_status: 'MATCHED',
        change_summary: 'ACB ONE BIZ ra mắt Open API liên kết ERP doanh nghiệp để chi trả lương và thanh toán nhà cung cấp tức thì.',
        newness: 'NEW',
        evidence: 'Kế toán trưởng chỉ cần phê duyệt trên phần mềm kế toán nội bộ, tiền được chuyển thẳng tới tài khoản nhân viên.',
        target_segment: 'BUSINESS',
        classification_confidence: 0.95,
        evidence_strength: 0.94,
        newness_confidence: 0.92,
        mapping_confidence: 0.94,
        source_reliability: 0.95,
        final_confidence: 0.94,
        published_at: '2026-06-18',
        detected_at: '2026-06-18',
        review_status: 'APPROVED_DISCOVERY',
        sources: [
          {
            id: 'src-acb-007-web',
            crawl_content_id: 'cc-acb-007-web',
            exact_content_url: 'https://acb.com.vn/doanh-nghiep-giai-phap-thanh-toan/acb-one-biz/chi-luong-tu-dong-api',
            content_url: 'https://acb.com.vn/doanh-nghiep-giai-phap-thanh-toan/acb-one-biz/chi-luong-tu-dong-api',
            url: 'https://acb.com.vn/doanh-nghiep-giai-phap-thanh-toan/acb-one-biz/chi-luong-tu-dong-api',
            url_validation_status: 'VALID',
            source_type: 'website',
            type: 'website',
            title: 'Chi lương tự động qua Open API trên ACB ONE BIZ',
            evidence_text: 'Kết nối trực tiếp phần mềm MISA/Fast/Bravo chi lương tự động không cần xuất file.',
            published_at: '2026-06-18',
          },
          {
            id: 'src-acb-007-fb',
            crawl_content_id: 'cc-acb-007-fb',
            exact_content_url: 'https://www.facebook.com/NganHangACB/posts/pfbid029XmN83746529a',
            content_url: 'https://www.facebook.com/NganHangACB/posts/pfbid029XmN83746529a',
            url: 'https://www.facebook.com/NganHangACB/posts/pfbid029XmN83746529a',
            url_validation_status: 'VALID',
            source_type: 'facebook',
            type: 'facebook',
            title: 'Bài viết hợp tác ACB & MISA chi lương tự động',
            evidence_text: 'Tự động hóa 100% quy trình trả lương và hạch toán kế toán.',
            published_at: '2026-06-18',
          },
        ],
        source_count: 2,
        created_at: new Date().toISOString(),
      },
      {
        id: 'disc-tcb-008',
        org_id: this.orgId,
        bank_id: tcbBank.id,
        bank_name: 'Techcombank Business',
        platform_name: 'Techcombank Business',
        product_name: 'Techcombank Business',
        feature_name: 'Phát hành bảo lãnh điện tử e-Guarantee siêu tốc 2h',
        content_type: 'NEW_FEATURE',
        journey: 'D. TÍN DỤNG',
        benchmark_component_id: this.components.find((c) => c.name.includes('bảo lãnh') || c.name.includes('Bảo lãnh'))?.id || null,
        benchmark_component_name: 'Bảo lãnh online',
        suggested_component: null,
        suggested_score: 3,
        suggested_description: 'Phát hành bảo lãnh dự thầu số kết nối trực tiếp Mạng Đấu thầu Quốc gia.',
        mapping_status: 'MATCHED',
        change_summary: 'Techcombank Business cho phép doanh nghiệp phát hành và gửi thư bảo lãnh điện tử tới chủ đầu tư trong 2 giờ.',
        newness: 'NEW',
        evidence: 'Quy trình thẩm định và phát hành bảo lãnh tự động 100% không yêu cầu hồ sơ bản cứng.',
        target_segment: 'BUSINESS',
        classification_confidence: 0.96,
        evidence_strength: 0.95,
        newness_confidence: 0.93,
        mapping_confidence: 0.95,
        source_reliability: 1.0,
        final_confidence: 0.95,
        published_at: '2026-06-25',
        detected_at: '2026-06-25',
        review_status: 'APPROVED_DISCOVERY',
        sources: [
          {
            id: 'src-tcb-008-web',
            crawl_content_id: 'cc-tcb-008-web',
            exact_content_url: 'https://techcombank.com/khach-hang-doanh-nghiep/tai-tro-thuong-mai-va-bao-lanh/bao-lanh-dien-tu',
            content_url: 'https://techcombank.com/khach-hang-doanh-nghiep/tai-tro-thuong-mai-va-bao-lanh/bao-lanh-dien-tu',
            url: 'https://techcombank.com/khach-hang-doanh-nghiep/tai-tro-thuong-mai-va-bao-lanh/bao-lanh-dien-tu',
            url_validation_status: 'VALID',
            source_type: 'website',
            type: 'website',
            title: 'Bảo lãnh điện tử e-Guarantee Techcombank Business',
            evidence_text: 'Phát hành thư bảo lãnh dự thầu số liên thông hệ thống đấu thầu quốc gia trong 2 giờ.',
            published_at: '2026-06-25',
          },
          {
            id: 'src-tcb-008-fb',
            crawl_content_id: 'cc-tcb-008-fb',
            exact_content_url: 'https://www.facebook.com/Techcombank/posts/pfbid02xK9wJ1hE89Z78FmNqL32a',
            content_url: 'https://www.facebook.com/Techcombank/posts/pfbid02xK9wJ1hE89Z78FmNqL32a',
            url: 'https://www.facebook.com/Techcombank/posts/pfbid02xK9wJ1hE89Z78FmNqL32a',
            url_validation_status: 'VALID',
            source_type: 'facebook',
            type: 'facebook',
            title: 'Bài viết bảo lãnh điện tử siêu tốc Techcombank',
            evidence_text: 'Bảo lãnh dự thầu online 100% không cần đến quầy giao dịch.',
            published_at: '2026-06-25',
          },
        ],
        source_count: 2,
        created_at: new Date().toISOString(),
      },
      // --- LEGACY RECORD WITHOUT REAL SOURCE LINEAGE (Section 13) ---
      {
        id: 'disc-legacy-001',
        org_id: this.orgId,
        bank_id: tcbBank.id,
        bank_name: 'Techcombank Business',
        platform_name: 'Techcombank Business',
        product_name: 'Techcombank Business',
        feature_name: 'Tính năng quản lý dòng tiền tự động (Dữ liệu cũ)',
        content_type: 'NEW_FEATURE',
        journey: 'B. TÀI KHOẢN & THANH TOÁN',
        benchmark_component_id: null,
        benchmark_component_name: null,
        suggested_component: 'Quản lý dòng tiền',
        suggested_score: 2,
        suggested_description: 'Dữ liệu cào trước khi có chuẩn lineage.',
        mapping_status: 'UNMAPPED',
        change_summary: 'Bản ghi cũ không có liên kết crawl_content_id.',
        newness: 'UNKNOWN',
        evidence: 'Phát hiện trước đây nhưng không lưu nguồn chính xác.',
        target_segment: 'BUSINESS',
        classification_confidence: 0.7,
        evidence_strength: 0.5,
        newness_confidence: 0.5,
        mapping_confidence: 0.5,
        source_reliability: 0.5,
        final_confidence: 0.65,
        published_at: '2026-06-01',
        detected_at: '2026-06-01',
        review_status: 'NEEDS_REVIEW',
        review_reason: 'MISSING_SOURCE_LINEAGE',
        source_lineage_status: 'MISSING',
        sources: [],
        source_count: 0,
        created_at: new Date().toISOString(),
      },
    ];

    // Build CrawlContents from all seed discoveries to enforce strict immutable lineage
    this.crawlContents = [];
    this.productDiscoveries.forEach((d) => {
      d.sources.forEach((s) => {
        if (s.crawl_content_id) {
          const exactUrl = s.exact_content_url || s.content_url || s.url || '';
          s.exact_content_url = exactUrl;
          s.url = exactUrl;
          this.crawlContents.push({
            id: s.crawl_content_id,
            bank_id: d.bank_id,
            source_type: s.source_type,
            seed_url: s.seed_url || s.crawl_source_url || null,
            crawl_source_url: s.crawl_source_url || s.seed_url || null,
            raw_href: s.raw_href || exactUrl || null,
            resolved_url: s.resolved_url || exactUrl || null,
            final_url: s.final_url || exactUrl || null,
            exact_content_url: exactUrl,
            content_url: exactUrl || undefined,
            canonical_url: s.canonical_url || null,
            title: s.title || d.feature_name,
            published_at: s.published_at || d.published_at,
            clean_text: s.evidence_text || d.evidence,
            evidence_text: s.evidence_text || d.evidence,
            content_hash: null,
            extraction_method: s.extraction_method || 'ANCHOR',
            url_validation_status: s.url_validation_status || (exactUrl ? 'VALID' : 'MISSING'),
            url_validation_reason: s.url_validation_reason || null,
            created_at: d.created_at || new Date().toISOString(),
          });
        }
      });
    });
  }

  async getCrawlContents(): Promise<CrawlContent[]> {
    this.initCrawlerSeeds();
    const supabase = this.getClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('crawl_contents').select('*');
        if (!error && data && data.length > 0) {
          return data as CrawlContent[];
        }
      } catch (err) {
        console.warn('Supabase getCrawlContents warning:', err);
      }
    }
    return [...this.crawlContents];
  }

  async getCrawlContentById(id: string): Promise<CrawlContent | undefined> {
    this.initCrawlerSeeds();
    const supabase = this.getClient();
    if (supabase) {
      try {
        const { data, error } = await supabase.from('crawl_contents').select('*').eq('id', id).single();
        if (!error && data) {
          return data as CrawlContent;
        }
      } catch (err) {
        console.warn('Supabase getCrawlContentById warning:', err);
      }
    }
    return this.crawlContents.find((c) => c.id === id);
  }

  async addCrawlContents(items: CrawlContent[]): Promise<void> {
    items.forEach((item) => {
      const idx = this.crawlContents.findIndex((c) => c.id === item.id);
      if (idx !== -1) {
        this.crawlContents[idx] = item;
      } else {
        this.crawlContents.unshift(item);
      }
    });

    const supabase = this.getClient();
    if (supabase) {
      try {
        for (const item of items) {
          await supabase.from('crawl_contents').upsert({
            id: item.id,
            bank_id: item.bank_id || null,
            crawl_source_id: item.crawl_source_id || null,
            source_type: item.source_type,
            seed_url: item.seed_url || item.crawl_source_url || null,
            raw_href: item.raw_href || item.exact_content_url || null,
            resolved_url: item.resolved_url || item.exact_content_url || null,
            final_url: item.final_url || item.exact_content_url || null,
            exact_content_url: item.exact_content_url,
            canonical_url: item.canonical_url || null,
            title: item.title || null,
            published_at: item.published_at || null,
            raw_text: item.raw_text || null,
            clean_text: item.clean_text || null,
            evidence_text: item.evidence_text || null,
            content_hash: item.content_hash || null,
            extraction_method: item.extraction_method || 'ANCHOR',
            url_validation_status: item.url_validation_status || 'VALID',
            url_validation_reason: item.url_validation_reason || null,
            created_at: item.created_at || new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn('Supabase addCrawlContents warning:', err);
      }
    }
  }

  async getDiscoveredUrls(bankId?: string): Promise<SourceDiscoveredUrl[]> {
    this.initCrawlerSeeds();
    const supabase = this.getClient();
    if (supabase) {
      try {
        let query = supabase.from('source_discovered_urls').select('*').order('discovered_at', { ascending: false });
        if (bankId) query = query.eq('bank_id', bankId);
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data as SourceDiscoveredUrl[];
        }
      } catch (err) {
        console.warn('Supabase getDiscoveredUrls warning:', err);
      }
    }
    if (bankId) {
      return this.discoveredUrls.filter((u) => u.bank_id === bankId);
    }
    return [...this.discoveredUrls];
  }

  async updateDiscoveredUrlStatus(id: string, status: 'TRACKING' | 'REVIEW' | 'IGNORE'): Promise<SourceDiscoveredUrl | undefined> {
    const item = this.discoveredUrls.find((u) => u.id === id);
    if (item) {
      item.status = status;
      item.reviewed_at = new Date().toISOString();
    }

    const supabase = this.getClient();
    if (supabase) {
      try {
        await supabase.from('source_discovered_urls').update({ status, reviewed_at: new Date().toISOString() }).eq('id', id);
      } catch (err) {
        console.warn('Supabase updateDiscoveredUrlStatus warning:', err);
      }
    }

    return item;
  }

  async addDiscoveredUrls(urls: SourceDiscoveredUrl[]): Promise<void> {
    urls.forEach((u) => {
      const idx = this.discoveredUrls.findIndex((item) => item.url === u.url);
      if (idx !== -1) {
        this.discoveredUrls[idx] = u;
      } else {
        this.discoveredUrls.unshift(u);
      }
    });

    const supabase = this.getClient();
    if (supabase) {
      try {
        for (const u of urls) {
          await supabase.from('source_discovered_urls').upsert({
            id: u.id,
            bank_id: u.bank_id,
            parent_source_id: u.parent_source_id,
            url: u.url,
            page_title: u.page_title,
            h1: u.h1,
            classification: u.classification,
            relevance_score: u.relevance_score,
            reason: u.reason,
            status: u.status,
            discovered_at: u.discovered_at || new Date().toISOString(),
          });
        }
      } catch (err) {
        console.warn('Supabase addDiscoveredUrls warning:', err);
      }
    }
  }

  async getProductDiscoveries(filter?: {
    status?: DiscoveryReviewStatus;
    bank_id?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<ProductDiscovery[]> {
    this.initCrawlerSeeds();
    const supabase = this.getClient();
    if (supabase) {
      try {
        let query = supabase
          .from('product_discoveries')
          .select('*, discovery_sources(*, crawl_contents(*))')
          .order('detected_at', { ascending: false });
        if (filter?.status) query = query.eq('review_status', filter.status);
        if (filter?.bank_id) query = query.eq('bank_id', filter.bank_id);
        if (filter?.date_from) query = query.gte('detected_at', filter.date_from);
        if (filter?.date_to) query = query.lte('detected_at', filter.date_to);
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data.map((d: any) => {
            const sources = (d.discovery_sources || []).map((s: any) => {
              const cc = s.crawl_contents;
              const exactUrl = cc?.exact_content_url || s.exact_content_url || s.content_url || s.url || '';
              const hasLineage = Boolean(s.crawl_content_id && exactUrl);
              const valStatus: UrlValidationStatus = hasLineage
                ? (cc?.url_validation_status || s.url_validation_status || 'VALID')
                : 'MISSING';

              return {
                id: s.id,
                discovery_id: d.id,
                crawl_content_id: s.crawl_content_id || null,
                source_type: cc?.source_type || s.source_type,
                type: cc?.source_type || s.source_type,
                url: exactUrl,
                exact_content_url: exactUrl,
                content_url: exactUrl || null,
                seed_url: cc?.seed_url || cc?.crawl_source_url || s.seed_url || s.crawl_source_url || null,
                crawl_source_url: cc?.crawl_source_url || cc?.seed_url || s.crawl_source_url || s.seed_url || null,
                raw_href: cc?.raw_href || s.raw_href || exactUrl || null,
                resolved_url: cc?.resolved_url || s.resolved_url || exactUrl || null,
                final_url: cc?.final_url || s.final_url || exactUrl || null,
                canonical_url: cc?.canonical_url || s.canonical_url || null,
                url_validation_status: valStatus,
                url_validation_reason: cc?.url_validation_reason || s.url_validation_reason || (!hasLineage ? 'MISSING_SOURCE_LINEAGE' : null),
                extraction_method: cc?.extraction_method || s.extraction_method || 'ANCHOR',
                title: cc?.title || s.title || null,
                evidence_text: cc?.evidence_text || s.evidence_text || null,
                evidence: cc?.evidence_text || s.evidence_text || null,
                published_at: cc?.published_at || s.published_at,
              };
            });

            const hasValidSource = sources.some((s: any) => s.url && s.url_validation_status === 'VALID');
            const lineageStatus: SourceLineageStatus =
              (d.source_lineage_status === 'MISSING' || sources.length === 0 || !hasValidSource)
                ? 'MISSING'
                : 'VERIFIED';
            const reviewStatus = lineageStatus === 'MISSING' ? 'NEEDS_REVIEW' : d.review_status;

            return {
              ...d,
              review_status: reviewStatus,
              source_lineage_status: lineageStatus,
              sources,
              source_count: sources.length || 0,
            };
          }) as ProductDiscovery[];
        }
      } catch (err) {
        console.warn('Supabase getProductDiscoveries warning:', err);
      }
    }

    let list = [...this.productDiscoveries];
    if (filter?.status) {
      list = list.filter((d) => d.review_status === filter.status);
    }
    if (filter?.bank_id) {
      list = list.filter((d) => d.bank_id === filter.bank_id);
    }
    if (filter?.date_from) {
      list = list.filter((d) => {
        const itemDate = (d.detected_at || d.published_at || '').slice(0, 10);
        return itemDate >= filter.date_from!;
      });
    }
    if (filter?.date_to) {
      list = list.filter((d) => {
        const itemDate = (d.detected_at || d.published_at || '').slice(0, 10);
        return itemDate <= filter.date_to!;
      });
    }
    return list.sort((a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime());
  }

  async addProductDiscoveries(items: ProductDiscovery[]): Promise<void> {
    items.forEach((item) => {
      const idx = this.productDiscoveries.findIndex((p) => p.id === item.id);
      if (idx !== -1) {
        this.productDiscoveries[idx] = item;
      } else {
        this.productDiscoveries.unshift(item);
      }
    });

    const supabase = this.getClient();
    if (supabase) {
      try {
        for (const item of items) {
          await supabase.from('product_discoveries').upsert({
            id: item.id,
            org_id: this.orgId,
            bank_id: item.bank_id,
            platform_name: item.platform_name,
            product_name: item.product_name,
            feature_name: item.feature_name,
            content_type: item.content_type,
            journey: item.journey,
            benchmark_component_id: item.benchmark_component_id,
            suggested_component: item.suggested_component,
            suggested_score: item.suggested_score,
            suggested_description: item.suggested_description,
            mapping_status: item.mapping_status,
            change_summary: item.change_summary,
            newness: item.newness,
            evidence: item.evidence,
            target_segment: item.target_segment || 'BUSINESS',
            classification_confidence: item.classification_confidence,
            evidence_strength: item.evidence_strength,
            newness_confidence: item.newness_confidence,
            mapping_confidence: item.mapping_confidence,
            source_reliability: item.source_reliability,
            final_confidence: item.final_confidence,
            published_at: item.published_at,
            detected_at: item.detected_at,
            review_status: item.review_status,
            review_reason: item.review_reason || null,
            source_lineage_status: item.source_lineage_status || 'VERIFIED',
          });

          for (const s of item.sources) {
            const contentId = s.crawl_content_id || crypto.randomUUID();
            const exactUrl = s.exact_content_url || s.content_url || s.url || '';

            // 1. Insert into crawl_contents to maintain strict foreign key link
            if (exactUrl) {
              await supabase.from('crawl_contents').upsert({
                id: contentId,
                bank_id: item.bank_id,
                source_type: s.source_type,
                seed_url: s.seed_url || s.crawl_source_url || null,
                crawl_source_url: s.crawl_source_url || s.seed_url || null,
                raw_href: s.raw_href || exactUrl,
                resolved_url: s.resolved_url || exactUrl,
                final_url: s.final_url || exactUrl,
                exact_content_url: exactUrl,
                canonical_url: s.canonical_url || null,
                content_url: exactUrl,
                url_validation_status: s.url_validation_status || 'VALID',
                url_validation_reason: s.url_validation_reason || null,
                extraction_method: s.extraction_method || 'ANCHOR',
                title: s.title || item.feature_name,
                evidence_text: s.evidence_text || item.evidence,
                published_at: s.published_at,
              });
            }

            // 2. Insert into discovery_sources
            await supabase.from('discovery_sources').insert({
              discovery_id: item.id,
              crawl_content_id: exactUrl ? contentId : null,
              created_at: new Date().toISOString(),
            });
          }
        }
      } catch (err) {
        console.warn('Supabase addProductDiscoveries warning:', err);
      }
    }
  }

  async updateProductDiscoveryReviewStatus(
    id: string,
    status: DiscoveryReviewStatus,
    notes?: string
  ): Promise<ProductDiscovery | undefined> {
    const item = this.productDiscoveries.find((d) => d.id === id);
    if (item) {
      item.review_status = status;
      item.updated_at = new Date().toISOString();
    }

    const supabase = this.getClient();
    if (supabase) {
      try {
        await supabase.from('product_discoveries').update({ review_status: status, updated_at: new Date().toISOString() }).eq('id', id);
        await supabase.from('review_actions').insert({
          discovery_id: id,
          action_type: status === 'APPROVED_DISCOVERY' ? 'APPROVE' : status === 'REJECTED' ? 'REJECT' : 'NEEDS_REVIEW',
          notes: notes || `Chuyển trạng thái sang ${status}`,
        });
      } catch (err) {
        console.warn('Supabase updateProductDiscoveryReviewStatus warning:', err);
      }
    }

    return item;
  }

  /**
   * BENCHMARK SAFETY RULE:
   * Explicitly updates benchmark cells ONLY upon user approval action [Apply to benchmark].
   */
  async applyDiscoveryToBenchmark(
    discoveryId: string,
    customScore?: ScoreValue,
    customDescription?: string,
    targetComponentId?: string,
    userId?: string
  ): Promise<{ cell: BenchmarkCell; discovery: ProductDiscovery }> {
    const discovery = this.productDiscoveries.find((d) => d.id === discoveryId);
    if (!discovery) throw new Error('Không tìm thấy sự kiện phát hiện sản phẩm');

    const componentId = targetComponentId || discovery.benchmark_component_id;
    if (!componentId) {
      throw new Error('Chưa có cấu phần benchmark được chỉ định để áp dụng');
    }

    const finalScore = customScore !== undefined ? customScore : discovery.suggested_score ?? 3;
    const finalDesc = customDescription || discovery.suggested_description || discovery.change_summary;

    // 1. Update Benchmark Cell
    const cell = await this.updateCell(componentId, discovery.bank_id, finalDesc, finalScore);

    // 2. Mark discovery as BENCHMARK_APPLIED
    discovery.review_status = 'BENCHMARK_APPLIED';
    discovery.updated_at = new Date().toISOString();

    const supabase = this.getClient();
    if (supabase) {
      try {
        await supabase.from('product_discoveries').update({
          review_status: 'BENCHMARK_APPLIED',
          benchmark_component_id: componentId,
          updated_at: discovery.updated_at,
        }).eq('id', discoveryId);

        await supabase.from('review_actions').insert({
          discovery_id: discoveryId,
          user_id: userId || 'usr-analyst',
          action_type: 'APPLY_BENCHMARK',
          new_score: finalScore,
          new_description: finalDesc,
          notes: 'Người dùng đã duyệt và cập nhật thành công vào Ma trận Benchmark',
        });
      } catch (err) {
        console.warn('Supabase applyDiscoveryToBenchmark warning:', err);
      }
    }

    return { cell, discovery };
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
