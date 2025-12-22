'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface CostCode {
  id: string;
  division_id: string;
  division_title: string | null;
  title: string | null;
  description?: string;
}

interface CostCodesTabProps {
  projectId: string;
}

export function CostCodesTab({ projectId }: CostCodesTabProps) {
  const [costCodes, setCostCodes] = useState<CostCode[]>([]);
  const [selectedCostCodes, setSelectedCostCodes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const supabase = createClient();

        // Fetch all cost codes
        const { data: codesData, error: codesError } = await supabase
          .from('cost_codes')
          .select('id, division_id, division_title, title')
          .order('division_id', { ascending: true })
          .order('id', { ascending: true });

        if (codesError) throw codesError;

        // Fetch project cost codes (selected ones)
        const { data: projectCodesData, error: projectCodesError } = await supabase
          .from('project_cost_codes')
          .select('cost_code_id')
          .eq('project_id', parseInt(projectId, 10))
          .eq('is_active', true);

        if (projectCodesError) throw projectCodesError;

        setCostCodes(codesData || []);
        setSelectedCostCodes(new Set((projectCodesData || []).map(pc => pc.cost_code_id)));
      } catch (error) {
        console.error('Error loading cost codes:', error);
        toast.error('Failed to load cost codes');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [projectId]);

  // Group cost codes by division
  const groupedCostCodes = costCodes.reduce((acc, code) => {
    const divisionKey = `${code.division_id} - ${code.division_title || 'No Division'}`;
    if (!acc[divisionKey]) {
      acc[divisionKey] = [];
    }
    acc[divisionKey].push(code);
    return acc;
  }, {} as Record<string, CostCode[]>);

  // Filter by search query
  const filteredDivisions = Object.entries(groupedCostCodes).filter(([division, codes]) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      division.toLowerCase().includes(query) ||
      codes.some(code =>
        code.id.toLowerCase().includes(query) ||
        code.title?.toLowerCase().includes(query)
      )
    );
  });

  const toggleDivision = (division: string) => {
    setExpandedDivisions(prev => {
      const next = new Set(prev);
      if (next.has(division)) {
        next.delete(division);
      } else {
        next.add(division);
      }
      return next;
    });
  };

  const toggleCostCode = (costCodeId: string) => {
    setSelectedCostCodes(prev => {
      const next = new Set(prev);
      if (next.has(costCodeId)) {
        next.delete(costCodeId);
      } else {
        next.add(costCodeId);
      }
      return next;
    });
  };

  const selectAllInDivision = (codes: CostCode[], select: boolean) => {
    setSelectedCostCodes(prev => {
      const next = new Set(prev);
      codes.forEach(code => {
        if (select) {
          next.add(code.id);
        } else {
          next.delete(code.id);
        }
      });
      return next;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const supabase = createClient();
      const projectIdNum = parseInt(projectId, 10);

      // Get current project cost codes
      const { data: currentProjectCodes, error: fetchError } = await supabase
        .from('project_cost_codes')
        .select('id, cost_code_id')
        .eq('project_id', projectIdNum);

      if (fetchError) throw fetchError;

      const currentCodeIds = new Set((currentProjectCodes || []).map(pc => pc.cost_code_id));

      // Determine what to add and what to remove
      const toAdd = Array.from(selectedCostCodes).filter(id => !currentCodeIds.has(id));
      const toRemove = Array.from(currentCodeIds).filter(id => !selectedCostCodes.has(id));

      // Add new cost codes
      if (toAdd.length > 0) {
        const { error: insertError } = await supabase
          .from('project_cost_codes')
          .insert(
            toAdd.map(costCodeId => ({
              project_id: projectIdNum,
              cost_code_id: costCodeId,
              is_active: true,
            }))
          );

        if (insertError) throw insertError;
      }

      // Remove unselected cost codes
      if (toRemove.length > 0) {
        const idsToDelete = (currentProjectCodes || [])
          .filter(pc => toRemove.includes(pc.cost_code_id))
          .map(pc => pc.id);

        const { error: deleteError } = await supabase
          .from('project_cost_codes')
          .delete()
          .in('id', idsToDelete);

        if (deleteError) throw deleteError;
      }

      toast.success(`Successfully updated project cost codes (${selectedCostCodes.size} selected)`);
    } catch (error) {
      console.error('Error saving cost codes:', error);
      toast.error('Failed to save cost codes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading cost codes...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Project Cost Codes</h2>
          <p className="text-sm text-gray-600">
            Select which cost codes are active for this project ({selectedCostCodes.size} selected)
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {/* Search */}
      <div className="max-w-md">
        <Label htmlFor="search">Search Cost Codes</Label>
        <Input
          id="search"
          placeholder="Search by code or title..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Cost Codes List */}
      <div className="space-y-2">
        {filteredDivisions.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            No cost codes found matching your search
          </div>
        ) : (
          filteredDivisions.map(([division, codes]) => {
            const isExpanded = expandedDivisions.has(division);
            const allSelected = codes.every(code => selectedCostCodes.has(code.id));

            return (
              <div key={division} className="border rounded-lg bg-white">
                <div className="flex items-center justify-between p-3 hover:bg-gray-50">
                  <button
                    className="flex items-center gap-2 cursor-pointer flex-1 text-left"
                    onClick={() => toggleDivision(division)}
                    type="button"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <span className="font-medium">{division}</span>
                    <span className="text-sm text-gray-500">
                      ({codes.filter(c => selectedCostCodes.has(c.id)).length}/{codes.length} selected)
                    </span>
                  </button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => selectAllInDivision(codes, !allSelected)}
                  >
                    {allSelected ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>

                {isExpanded && (
                  <div className="border-t p-3 space-y-2">
                    {codes.map(code => {
                      const isSelected = selectedCostCodes.has(code.id);

                      return (
                        <label
                          key={code.id}
                          className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleCostCode(code.id)}
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{code.id}</div>
                            {code.title && (
                              <div className="text-xs text-gray-600">{code.title}</div>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
