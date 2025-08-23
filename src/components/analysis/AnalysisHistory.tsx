'use client';

import { useState, useEffect } from 'react';
import { getAllAnalyses, getMarketIntelligence, deleteAnalysis, SavedAnalysis } from '@/lib/storage';
import { formatDistanceToNow } from 'date-fns';
import { Trash2, TrendingUp, BarChart3, Building, Calendar } from 'lucide-react';

export default function AnalysisHistory() {
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<SavedAnalysis | null>(null);
  const [marketIntel, setMarketIntel] = useState(getMarketIntelligence());

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = () => {
    const savedAnalyses = getAllAnalyses();
    setAnalyses(savedAnalyses);
    setMarketIntel(getMarketIntelligence());
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this analysis?')) {
      deleteAnalysis(id);
      loadAnalyses();
      if (selectedAnalysis?.id === id) {
        setSelectedAnalysis(null);
      }
    }
  };

  if (analyses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Analysis History</h3>
        <p className="text-gray-600">
          Analyze your first bid to start building your leveling database.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Market Intelligence Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          Market Intelligence
        </h3>
        
        <div className="grid md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{marketIntel.totalProjects}</p>
            <p className="text-sm text-gray-600">Projects Analyzed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              ${(marketIntel.averageProjectValue / 1000000).toFixed(1)}M
            </p>
            <p className="text-sm text-gray-600">Avg Project Value</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">
              {Object.keys(marketIntel.divisionBenchmarks).length}
            </p>
            <p className="text-sm text-gray-600">CSI Divisions</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">
              {Object.values(marketIntel.riskDistribution).reduce((sum, count) => sum + count, 0)}
            </p>
            <p className="text-sm text-gray-600">Risk Assessments</p>
          </div>
        </div>

        {/* Risk Distribution */}
        <div className="mt-4">
          <h4 className="font-semibold text-gray-900 mb-2">Risk Distribution</h4>
          <div className="flex space-x-4">
            {Object.entries(marketIntel.riskDistribution).map(([level, count]) => (
              <div key={level} className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  level === 'HIGH' ? 'bg-red-500' :
                  level === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                }`}></div>
                <span className="text-sm text-gray-600">
                  {level}: {count} ({((count / marketIntel.totalProjects) * 100).toFixed(0)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Analysis History List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Analysis History</h3>
        
        <div className="space-y-3">
          {analyses.map((analysis) => (
            <div 
              key={analysis.id}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedAnalysis?.id === analysis.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => setSelectedAnalysis(
                selectedAnalysis?.id === analysis.id ? null : analysis
              )}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <Building className="h-4 w-4 text-gray-600 mr-2" />
                    <h4 className="font-semibold text-gray-900">
                      {analysis.result.contractor_name}
                    </h4>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Amount:</span> ${analysis.result.total_amount.toLocaleString()}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDistanceToNow(new Date(analysis.timestamp), { addSuffix: true })}
                    </div>
                    <div>
                      <span className="font-medium">Divisions:</span> {Object.keys(analysis.result.csi_divisions).length}
                    </div>
                  </div>
                  
                  {analysis.result.project_name && (
                    <p className="text-sm text-gray-700 mt-1">
                      Project: {analysis.result.project_name}
                    </p>
                  )}
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(analysis.id);
                  }}
                  className="text-gray-400 hover:text-red-600 transition-colors ml-4"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              
              {/* Expanded Details */}
              {selectedAnalysis?.id === analysis.id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h5 className="font-semibold text-gray-900 mb-2">CSI Division Breakdown</h5>
                  <div className="grid md:grid-cols-2 gap-2 text-sm">
                    {Object.entries(analysis.result.csi_divisions).map(([code, data]) => {
                      const percentage = ((data.cost / analysis.result.total_amount) * 100).toFixed(1);
                      const benchmark = marketIntel.divisionBenchmarks[code];
                      
                      return (
                        <div key={code} className="flex justify-between">
                          <span>Division {code}:</span>
                          <span className="font-medium">
                            {percentage}%
                            {benchmark && (
                              <span className="text-gray-500 ml-1">
                                (avg: {benchmark.average.toFixed(1)}%)
                              </span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {analysis.comparisonData && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600">
                        <strong>Risk Level:</strong> {analysis.comparisonData.riskLevel} • 
                        <strong className="ml-2">Database Average:</strong> ${analysis.comparisonData.averageTotal.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}