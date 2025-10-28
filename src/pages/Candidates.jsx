import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FixedSizeList } from 'react-window'
import { Search, User } from 'lucide-react'
import { useDebounce } from '../hooks/useDebounce'

const stages = ['applied', 'screen', 'tech', 'offer', 'hired', 'rejected']

export default function Candidates() {
  const [candidates, setCandidates] = useState([])
  const [filteredCandidates, setFilteredCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStage, setFilterStage] = useState('')
  const [selectedStage, setSelectedStage] = useState(null)

  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    loadCandidates()
  }, [])

  useEffect(() => {
    filterCandidates()
  }, [debouncedSearch, filterStage, candidates])

  const loadCandidates = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: '1',
        pageSize: '1000'
      })
      
      const response = await fetch(`/api/candidates?${params}`)
      const data = await response.json()
      setCandidates(data.data || [])
    } catch (error) {
      console.error('Failed to load candidates:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterCandidates = () => {
    let filtered = [...candidates]
    
    if (debouncedSearch) {
      const lowerSearch = debouncedSearch.toLowerCase()
      filtered = filtered.filter(c =>
        c.name?.toLowerCase().includes(lowerSearch) ||
        c.email?.toLowerCase().includes(lowerSearch)
      )
    }
    
    if (filterStage) {
      filtered = filtered.filter(c => c.stage === filterStage)
    }
    
    setFilteredCandidates(filtered)
  }

  const Row = ({ index, style }) => {
    const candidate = filteredCandidates[index]
    return (
      <div style={style}>
        <Link
          to={`/candidates/${candidate.id}`}
          className="block px-4 py-3 border-b border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {candidate.name?.charAt(0) || '?'}
              </div>
              <div>
                <div className="font-medium text-gray-900">{candidate.name}</div>
                <div className="text-sm text-gray-600">{candidate.email}</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  candidate.stage === 'hired' ? 'bg-green-100 text-green-800' :
                  candidate.stage === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}
              >
                {candidate.stage}
              </span>
            </div>
          </div>
        </Link>
      </div>
    )
  }

  // Group candidates by stage for stats
  const stageStats = stages.reduce((acc, stage) => {
    acc[stage] = candidates.filter(c => c.stage === stage).length
    return acc
  }, {})

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Candidates</h1>
        <p className="text-gray-600 mt-1">Manage candidate pipeline</p>
      </div>

      {/* Stage Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stages.map(stage => (
          <div
            key={stage}
            onClick={() => setFilterStage(filterStage === stage ? '' : stage)}
            className={`bg-white rounded-lg shadow p-4 cursor-pointer transition-all ${
              filterStage === stage ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
            }`}
          >
            <div className="text-2xl font-bold text-gray-900">
              {stageStats[stage] || 0}
            </div>
            <div className="text-sm text-gray-600 capitalize">{stage}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Candidates List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="text-sm font-medium text-gray-700">
            {filteredCandidates.length} candidate{filteredCandidates.length !== 1 ? 's' : ''}
          </div>
        </div>
        
        {filteredCandidates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No candidates found
          </div>
        ) : (
          <FixedSizeList
            height={600}
            itemCount={filteredCandidates.length}
            itemSize={72}
            width="100%"
          >
            {Row}
          </FixedSizeList>
        )}
      </div>
    </div>
  )
}



