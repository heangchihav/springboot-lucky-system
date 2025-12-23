'use client'

import React, { useState, useEffect } from 'react'
import { serviceService, Service, CreateServiceRequest, UpdateServiceRequest } from '../../services/serviceService'

export default function ServiceManagementPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: ''
  })
  
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Fetch services on component mount
  useEffect(() => {
    fetchServices()
  }, [])

  const fetchServices = async () => {
    try {
      setLoading(true)
      setError(null)
      const servicesData = await serviceService.getAllServices()
      setServices(servicesData)
    } catch (err) {
      setError('Failed to fetch services. Please try again.')
      console.error('Error fetching services:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (editingService) {
        // Update existing service
        const updateData: UpdateServiceRequest = {
          name: formData.name,
          description: formData.description
        }
        const updatedService = await serviceService.updateService(editingService.id, updateData)
        setServices(prev => prev.map(s => s.id === editingService.id ? updatedService : s))
        alert('Service updated successfully!')
      } else {
        // Create new service
        const serviceData: CreateServiceRequest = {
          code: formData.code,
          name: formData.name,
          description: formData.description
        }
        const newService = await serviceService.createService(serviceData)
        setServices(prev => [...prev, newService])
        alert('Service created successfully!')
      }

      resetForm()
      setShowForm(false)
    } catch (error) {
      console.error('Error saving service:', error)
      alert(`Error saving service: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: ''
    })
    setEditingService(null)
    setIsSubmitting(false)
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setFormData({
      code: service.code,
      name: service.name,
      description: service.description || ''
    })
    setShowForm(true)
  }

  const toggleServiceStatus = async (serviceId: number) => {
    try {
      const service = services.find(s => s.id === serviceId)
      if (!service) return

      if (service.active) {
        await serviceService.deactivateService(serviceId)
      } else {
        await serviceService.activateService(serviceId)
      }

      setServices(prev => prev.map(s => 
        s.id === serviceId ? { ...s, active: !s.active } : s
      ))
    } catch (error) {
      console.error('Error toggling service status:', error)
      alert(`Error updating service status: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const deleteService = async (serviceId: number) => {
    if (confirm('Are you sure you want to delete this service?')) {
      try {
        await serviceService.deleteService(serviceId)
        setServices(prev => prev.filter(service => service.id !== serviceId))
        alert('Service deleted successfully!')
      } catch (error) {
        console.error('Error deleting service:', error)
        alert(`Error deleting service: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white">User Service · Service Management</h2>
        <p className="text-slate-300">
          Manage system services and their configurations.
        </p>
      </div>

      {/* Search and Create Button */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
          />
          <svg className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <button
          onClick={() => {
            resetForm()
            setShowForm(!showForm)
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
        >
          {showForm ? 'Cancel' : 'Create Service'}
        </button>
      </div>

      {/* Create/Edit Service Form */}
      {showForm && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-medium text-white mb-4">
            {editingService ? 'Edit Service' : 'Create New Service'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="code" className="block text-sm font-medium text-slate-300 mb-1">
                  Service Code
                </label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  required
                  disabled={!!editingService}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  placeholder="e.g., user, call, delivery"
                />
                {editingService && (
                  <p className="text-xs text-slate-400 mt-1">Service code cannot be changed</p>
                )}
              </div>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">
                  Service Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter service name"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1">
                Description (Optional)
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter service description"
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  resetForm()
                  setShowForm(false)
                }}
                className="px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Saving...' : (editingService ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-900/50 border border-red-700 rounded-md">
          <p className="text-red-200">{error}</p>
          <button
            onClick={fetchServices}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Services Table */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Loading services...
                  </td>
                </tr>
              ) : filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    {searchTerm ? 'No services found matching your search.' : 'No services available.'}
                  </td>
                </tr>
              ) : (
                filteredServices.map((service) => (
                  <tr key={service.id} className="hover:bg-slate-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {service.code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {service.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-300">
                      {service.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        service.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {service.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {service.createdAt ? new Date(service.createdAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(service)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => toggleServiceStatus(service.id)}
                          className={`hover:underline ${
                            service.active ? 'text-yellow-400 hover:text-yellow-300' : 'text-green-400 hover:text-green-300'
                          }`}
                        >
                          {service.active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => deleteService(service.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
