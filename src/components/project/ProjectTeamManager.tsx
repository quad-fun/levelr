'use client';

import React, { useState } from 'react';
import { SavedProject, TeamMember } from '@/types/project';
import {
  Users, Plus, Mail, Phone, Building, Shield,
  Edit, Trash2, UserPlus, Crown, Settings
} from 'lucide-react';

interface ProjectTeamManagerProps {
  project: SavedProject;
  onTeamUpdate: () => void;
}

export default function ProjectTeamManager({ project, onTeamUpdate }: ProjectTeamManagerProps) {
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const getRoleIcon = (role: string) => {
    if (role.toLowerCase().includes('owner') || role.toLowerCase().includes('manager')) {
      return <Crown className="h-4 w-4 text-yellow-600" />;
    }
    return <Users className="h-4 w-4 text-blue-600" />;
  };

  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'edit': return 'bg-blue-100 text-blue-800';
      case 'financial': return 'bg-green-100 text-green-800';
      case 'rfp_management': return 'bg-purple-100 text-purple-800';
      case 'view': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const allTeamMembers = [
    project.team.owner,
    ...(project.team.projectManager ? [project.team.projectManager] : []),
    ...project.team.members,
    ...project.team.consultants
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team Management</h2>
          <p className="text-gray-600 mt-1">
            Manage project team members, roles, and permissions
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowAddMember(true)}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </button>
        </div>
      </div>

      {/* Team Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Members</p>
              <p className="text-2xl font-bold text-gray-900">{allTeamMembers.length}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Core Team</p>
              <p className="text-2xl font-bold text-gray-900">
                {1 + (project.team.projectManager ? 1 : 0) + project.team.members.length}
              </p>
            </div>
            <Crown className="h-8 w-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Consultants</p>
              <p className="text-2xl font-bold text-gray-900">{project.team.consultants.length}</p>
            </div>
            <Building className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Admin Access</p>
              <p className="text-2xl font-bold text-gray-900">
                {allTeamMembers.filter(member => member.permissions.includes('admin')).length}
              </p>
            </div>
            <Shield className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Team Members List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
        </div>

        <div className="divide-y divide-gray-200">
          {allTeamMembers.map((member, index) => {
            const isOwner = member.id === project.team.owner.id;
            const isProjectManager = project.team.projectManager && member.id === project.team.projectManager.id;
            const isConsultant = project.team.consultants.some(c => c.id === member.id);

            return (
              <div key={member.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-lg">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* Member Info */}
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-lg font-medium text-gray-900">{member.name}</h4>
                        {getRoleIcon(member.role)}
                        {isOwner && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                            Owner
                          </span>
                        )}
                        {isProjectManager && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            Project Manager
                          </span>
                        )}
                        {isConsultant && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            Consultant
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600">{member.role}</p>
                      <p className="text-sm text-gray-500">{member.company}</p>

                      {/* Contact Info */}
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <Mail className="h-3 w-3" />
                          <span>{member.email}</span>
                        </div>
                        {member.phone && (
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Phone className="h-3 w-3" />
                            <span>{member.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Permissions */}
                    <div className="flex flex-wrap gap-1">
                      {member.permissions.map((permission) => (
                        <span
                          key={permission}
                          className={`px-2 py-1 text-xs font-medium rounded-full ${getPermissionColor(permission)}`}
                        >
                          {permission.replace('_', ' ')}
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setSelectedMember(member)}
                        className="text-gray-400 hover:text-blue-600"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      {!isOwner && (
                        <button className="text-gray-400 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Responsibilities */}
                {member.responsibility.length > 0 && (
                  <div className="mt-4 pl-16">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Responsibilities:</h5>
                    <div className="flex flex-wrap gap-2">
                      {member.responsibility.map((resp, respIndex) => (
                        <span
                          key={respIndex}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {resp}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Organization Chart */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Project Organization</h3>

        <div className="space-y-6">
          {/* Owner Level */}
          <div className="text-center">
            <div className="inline-block">
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Crown className="h-5 w-5 text-yellow-600" />
                  <div>
                    <h4 className="font-medium text-gray-900">{project.team.owner.name}</h4>
                    <p className="text-sm text-gray-600">Project Owner</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Project Manager Level */}
          {project.team.projectManager && (
            <div className="text-center">
              <div className="w-px h-8 bg-gray-300 mx-auto"></div>
              <div className="inline-block">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">{project.team.projectManager.name}</h4>
                      <p className="text-sm text-gray-600">Project Manager</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Team Members Level */}
          {(project.team.members.length > 0 || project.team.consultants.length > 0) && (
            <div className="text-center">
              <div className="w-px h-8 bg-gray-300 mx-auto"></div>
              <div className="flex justify-center space-x-4">
                {/* Core Team */}
                {project.team.members.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Core Team</h5>
                    <div className="space-y-2">
                      {project.team.members.map((member) => (
                        <div key={member.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                          <h6 className="font-medium text-gray-900 text-sm">{member.name}</h6>
                          <p className="text-xs text-gray-600">{member.role}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Consultants */}
                {project.team.consultants.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Consultants</h5>
                    <div className="space-y-2">
                      {project.team.consultants.map((consultant) => (
                        <div key={consultant.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <h6 className="font-medium text-gray-900 text-sm">{consultant.name}</h6>
                          <p className="text-xs text-gray-600">{consultant.role}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">Add Team Member</h3>
                <button
                  onClick={() => setShowAddMember(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="email@company.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Architect, Engineer, Contractor"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Member Type
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="member">Core Team Member</option>
                    <option value="consultant">Consultant</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Permissions
                  </label>
                  <div className="space-y-2">
                    {['view', 'edit', 'rfp_management', 'financial'].map((permission) => (
                      <label key={permission} className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 capitalize">
                          {permission.replace('_', ' ')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddMember(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    Add Member
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">Edit Member</h3>
                <button
                  onClick={() => setSelectedMember(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Permissions
                  </label>
                  <div className="space-y-2">
                    {['view', 'edit', 'rfp_management', 'financial', 'admin'].map((permission) => (
                      <label key={permission} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedMember.permissions.includes(permission as any)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 capitalize">
                          {permission.replace('_', ' ')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => setSelectedMember(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}