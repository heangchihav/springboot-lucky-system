'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../src/contexts/AuthContext';
import { areaBranchService, Area, Branch, CreateAreaRequest, CreateBranchRequest } from '../services/areaBranchService';

export default function AreaBranchManagement() {
  const { hasServiceAccess } = useAuth();
  const [activeTab, setActiveTab] = useState<'areas' | 'branches'>('areas');
  
  // Area states
  const [areas, setAreas] = useState<Area[]>([]);
  const [areaForm, setAreaForm] = useState<Partial<Area>>({ name: '', description: '', code: '', active: true });
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [showAreaForm, setShowAreaForm] = useState(false);
  
  // Branch states
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchForm, setBranchForm] = useState<Partial<Branch>>({ 
    name: '', 
    description: '', 
    code: '', 
    address: '', 
    phone: '', 
    email: '', 
    active: true,
    areaId: undefined,
    areaName: ''
  });
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [showBranchForm, setShowBranchForm] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch areas
  const fetchAreas = async () => {
    try {
      const data = await areaBranchService.getAreas();
      setAreas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch areas');
    }
  };

  // Fetch branches
  const fetchBranches = async () => {
    try {
      const data = await areaBranchService.getBranches();
      setBranches(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch branches');
    }
  };

  useEffect(() => {
    fetchAreas();
    fetchBranches();
  }, []);

  // Area operations
  const saveArea = async () => {
    setLoading(true);
    setError('');
    
    try {
      const areaData: CreateAreaRequest = {
        name: areaForm.name!,
        description: areaForm.description,
        code: areaForm.code,
        active: areaForm.active ?? true
      };

      if (editingArea) {
        await areaBranchService.updateArea(editingArea.id, areaData);
      } else {
        await areaBranchService.createArea(areaData);
      }
      
      await fetchAreas();
      resetAreaForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save area');
    } finally {
      setLoading(false);
    }
  };

  const deleteArea = async (id: number) => {
    if (!confirm('Are you sure you want to delete this area?')) return;
    
    try {
      await areaBranchService.deleteArea(id);
      await fetchAreas();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete area');
    }
  };

  const toggleAreaStatus = async (id: number, active: boolean) => {
    try {
      if (active) {
        await areaBranchService.activateArea(id);
      } else {
        await areaBranchService.deactivateArea(id);
      }
      await fetchAreas();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update area status');
    }
  };

  const editArea = (area: Area) => {
    setEditingArea(area);
    setAreaForm(area);
    setShowAreaForm(true);
  };

  const resetAreaForm = () => {
    setAreaForm({ name: '', description: '', code: '', active: true });
    setEditingArea(null);
    setShowAreaForm(false);
  };

  // Branch operations
  const saveBranch = async () => {
    setLoading(true);
    setError('');
    
    try {
      if (!branchForm.areaId) {
        throw new Error('Area is required for branch');
      }

      const branchData: CreateBranchRequest = {
        name: branchForm.name!,
        description: branchForm.description,
        code: branchForm.code,
        address: branchForm.address,
        phone: branchForm.phone,
        email: branchForm.email,
        active: branchForm.active ?? true,
        area: {
          id: branchForm.areaId!
        }
      };

      if (editingBranch) {
        await areaBranchService.updateBranch(editingBranch.id, branchData);
      } else {
        await areaBranchService.createBranch(branchData);
      }
      
      await fetchBranches();
      resetBranchForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save branch');
    } finally {
      setLoading(false);
    }
  };

  const deleteBranch = async (id: number) => {
    if (!confirm('Are you sure you want to delete this branch?')) return;
    
    try {
      await areaBranchService.deleteBranch(id);
      await fetchBranches();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete branch');
    }
  };

  const toggleBranchStatus = async (id: number, active: boolean) => {
    try {
      if (active) {
        await areaBranchService.activateBranch(id);
      } else {
        await areaBranchService.deactivateBranch(id);
      }
      await fetchBranches();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update branch status');
    }
  };

  const editBranch = (branch: Branch) => {
    setEditingBranch(branch);
    setBranchForm(branch);
    setShowBranchForm(true);
  };

  const resetBranchForm = () => {
    setBranchForm({ 
      name: '', 
      description: '', 
      code: '', 
      address: '', 
      phone: '', 
      email: '', 
      active: true,
      areaId: undefined,
      areaName: ''
    });
    setEditingBranch(null);
    setShowBranchForm(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">Call Service · Area & Branch Management</h2>
        <p className="text-slate-300">
          Manage areas and branches for the call service.
        </p>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-md">
          <div className="flex items-center">
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-slate-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('areas')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'areas'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600'
            }`}
          >
            Areas
          </button>
          <button
            onClick={() => setActiveTab('branches')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'branches'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-600'
            }`}
          >
            Branches
          </button>
        </nav>
      </div>

      {/* Areas Section */}
      {activeTab === 'areas' && (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Areas</h2>
            <button
              onClick={() => setShowAreaForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Add Area
            </button>
          </div>

          {showAreaForm && (
            <div className="mb-6 p-6 bg-slate-800 rounded-lg border border-slate-700">
              <h3 className="text-lg font-medium text-white mb-4">
                {editingArea ? 'Edit Area' : 'Add New Area'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Name *</label>
                  <input
                    type="text"
                    value={areaForm.name || ''}
                    onChange={(e) => setAreaForm({ ...areaForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Code</label>
                  <input
                    type="text"
                    value={areaForm.code || ''}
                    onChange={(e) => setAreaForm({ ...areaForm, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                  <textarea
                    value={areaForm.description || ''}
                    onChange={(e) => setAreaForm({ ...areaForm, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={areaForm.active || false}
                      onChange={(e) => setAreaForm({ ...areaForm, active: e.target.checked })}
                      className="mr-2 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    <span className="text-sm font-medium text-slate-300">Active</span>
                  </label>
                </div>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={resetAreaForm}
                  className="px-4 py-2 border border-slate-600 rounded-md text-slate-300 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  Cancel
                </button>
                <button
                  onClick={saveArea}
                  disabled={loading || !areaForm.name}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : (editingArea ? 'Update' : 'Save')}
                </button>
              </div>
            </div>
          )}

          <div className="bg-slate-800 shadow overflow-hidden rounded-lg border border-slate-700">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-800 divide-y divide-slate-700">
                {areas.map((area) => (
                  <tr key={area.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {area.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {area.code || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {area.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        area.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {area.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => editArea(area)}
                        className="text-blue-400 hover:text-blue-300 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleAreaStatus(area.id, !area.active)}
                        className={`mr-3 ${area.active ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300'}`}
                      >
                        {area.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => deleteArea(area.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Branches Section */}
      {activeTab === 'branches' && (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Branches</h2>
            <button
              onClick={() => setShowBranchForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Add Branch
            </button>
          </div>

          {showBranchForm && (
            <div className="mb-6 p-6 bg-slate-800 rounded-lg border border-slate-700">
              <h3 className="text-lg font-medium text-white mb-4">
                {editingBranch ? 'Edit Branch' : 'Add New Branch'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Name *</label>
                  <input
                    type="text"
                    value={branchForm.name || ''}
                    onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Code</label>
                  <input
                    type="text"
                    value={branchForm.code || ''}
                    onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Area *</label>
                  <select
                    value={branchForm.areaId ?? ''}
                    onChange={(e) => {
                      const selectedArea = areas.find(a => a.id === Number(e.target.value));
                      setBranchForm({ 
                        ...branchForm, 
                        areaId: selectedArea?.id, 
                        areaName: selectedArea?.name 
                      });
                    }}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="" className="bg-slate-700">Select Area</option>
                    {areas.filter(area => area.active).map((area) => (
                      <option key={area.id} value={area.id} className="bg-slate-700">
                        {area.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Phone</label>
                  <input
                    type="text"
                    value={branchForm.phone || ''}
                    onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={branchForm.email || ''}
                    onChange={(e) => setBranchForm({ ...branchForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Address</label>
                  <textarea
                    value={branchForm.address || ''}
                    onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                  <textarea
                    value={branchForm.description || ''}
                    onChange={(e) => setBranchForm({ ...branchForm, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={branchForm.active || false}
                      onChange={(e) => setBranchForm({ ...branchForm, active: e.target.checked })}
                      className="mr-2 rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    <span className="text-sm font-medium text-slate-300">Active</span>
                  </label>
                </div>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={resetBranchForm}
                  className="px-4 py-2 border border-slate-600 rounded-md text-slate-300 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  Cancel
                </button>
                <button
                  onClick={saveBranch}
                  disabled={loading || !branchForm.name || !branchForm.areaId}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : (editingBranch ? 'Update' : 'Save')}
                </button>
              </div>
            </div>
          )}

          <div className="bg-slate-800 shadow overflow-hidden rounded-lg border border-slate-700">
            <table className="min-w-full divide-y divide-slate-700">
              <thead className="bg-slate-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Area
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-800 divide-y divide-slate-700">
                {branches.map((branch) => (
                  <tr key={branch.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                      {branch.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {branch.code || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {branch.areaName || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      <div>{branch.phone || '-'}</div>
                      <div className="text-xs">{branch.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        branch.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {branch.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => editBranch(branch)}
                        className="text-blue-400 hover:text-blue-300 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleBranchStatus(branch.id, !branch.active)}
                        className={`mr-3 ${branch.active ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300'}`}
                      >
                        {branch.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => deleteBranch(branch.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}