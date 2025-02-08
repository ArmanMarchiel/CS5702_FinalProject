import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import MovieCharts from './MovieCharts';
import './styles.css';

const App = () => {
  const [movieData, setMovieData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    studio: '',
    franchise: ''
  });

  // Utility functions for data parsing
  const parseCurrency = (value) => {
    if (!value) return 0;
    return parseFloat(value.replace(/[$,]/g, '')) || 0;
  };

  const parseCast = (castString) => {
    if (!castString) return [];
    return castString.replace(/^"|"$/g, '')
                     .split(',')
                     .map(actor => actor.trim());
  };

  // Data loading effect
  useEffect(() => {
    const loadMovieData = async () => {
      // Attempt multiple paths for CSV
      const possiblePaths = [
        '/CS5702_FinalProject/movie_database.csv',
        '/movie_database.csv',
        'movie_database.csv'
      ];

      for (const path of possiblePaths) {
        try {
          console.log(`Attempting to load CSV from: ${path}`);
          
          const response = await fetch(path);
          
          if (!response.ok) {
            console.log(`Failed to fetch from ${path}. Status: ${response.status}`);
            continue;
          }

          const text = await response.text();
          
          Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              if (results.data && results.data.length > 0) {
                const processedData = results.data.map(movie => ({
                  ...movie,
                  roi: parseCurrency(movie['Adjusted Budget']) > 0 ? 
                    ((parseCurrency(movie['Adjusted International Box Office']) / 
                    (parseCurrency(movie['Adjusted Budget']) * 2.5) * 100) - 100) : -100,
                  castList: parseCast(movie.Cast)
                }));

                setMovieData(processedData);
                setLoading(false);
                return;
              }
            },
            error: (error) => {
              console.error('Parse error:', error);
            }
          });

          break;
        } catch (error) {
          console.error(`Error loading from ${path}:`, error);
        }
      }

      if (movieData.length === 0) {
        setError('Could not load movie database');
        setLoading(false);
      }
    };

    loadMovieData();
  }, []);

  // Rest of your existing logic remains the same...
  const calculateActorMetrics = (data) => {
    const actorStats = new Map();

    data.forEach(movie => {
      if (!movie.castList) return;
      
      movie.castList.forEach(actor => {
        if (!actor) return;
        
        if (!actorStats.has(actor)) {
          actorStats.set(actor, {
            movies: 0,
            totalROI: 0,
            averageROI: 0
          });
        }
        
        const stats = actorStats.get(actor);
        stats.movies += 1;
        stats.totalROI += movie.roi;
        stats.averageROI = stats.totalROI / stats.movies;
      });
    });

    const actorArray = Array.from(actorStats.entries())
      .filter(([_, stats]) => stats.movies >= 2)
      .map(([actor, stats]) => ({
        actor,
        ...stats
      }));

    const sortedByROI = [...actorArray].sort((a, b) => b.averageROI - a.averageROI);

    return {
      topActors: sortedByROI.slice(0, 5),
      bottomActors: sortedByROI.slice(-5).reverse()
    };
  };

  const filteredData = React.useMemo(() => {
    return movieData.filter(movie => {
      if (filters.studio && movie.Studio !== filters.studio) return false;
      if (filters.franchise && movie.Franchise !== filters.franchise) return false;
      return true;
    });
  }, [movieData, filters]);

  const metrics = React.useMemo(() => {
    if (!filteredData.length) return {
      averageROI: 0,
      topActors: [],
      bottomActors: []
    };

    const actorMetrics = calculateActorMetrics(filteredData);

    return {
      averageROI: filteredData.reduce((acc, movie) => acc + movie.roi, 0) / filteredData.length,
      ...actorMetrics
    };
  }, [filteredData]);

  // Render logic
  if (loading) return <div className="loading">Loading movie database...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Movie ROI Analytics</h1>
        <div className="filter-controls">
          <select 
            value={filters.studio} 
            onChange={(e) => setFilters({studio: e.target.value, franchise: ''})}
            className="filter-select"
          >
            <option value="">Select Studio</option>
            {[...new Set(movieData.map(m => m.Studio))].sort().map(studio => (
              <option key={studio} value={studio}>{studio}</option>
            ))}
          </select>
          
          {filters.studio && (
            <select 
              value={filters.franchise}
              onChange={(e) => setFilters(prev => ({...prev, franchise: e.target.value}))}
              className="filter-select"
            >
              <option value="">All Franchises</option>
              {[...new Set(movieData
                .filter(m => m.Studio === filters.studio)
                .map(m => m.Franchise))]
                .sort()
                .map(franchise => (
                  <option key={franchise} value={franchise}>{franchise}</option>
                ))}
            </select>
          )}
        </div>
      </header>

      <main className="dashboard-content">
        <div className="metrics-panel">
          <div className="metric-card">
            <h3>Average ROI</h3>
            <div className="metric-value">
              {metrics.averageROI.toFixed(2)}%
            </div>
          </div>
          <div className="metric-card">
            <h3>Top ROI Actors (2+ Movies)</h3>
            <div className="metric-value actor-list">
              {metrics.topActors.map((actor, i) => (
                <div key={actor.actor} className="actor-item">
                  {actor.actor}: {actor.averageROI.toFixed(1)}%
                </div>
              ))}
            </div>
          </div>
          <div className="metric-card">
            <h3>Lowest ROI Actors (2+ Movies)</h3>
            <div className="metric-value actor-list">
              {metrics.bottomActors.map((actor, i) => (
                <div key={actor.actor} className="actor-item">
                  {actor.actor}: {actor.averageROI.toFixed(1)}%
                </div>
              ))}
            </div>
          </div>
        </div>

        <MovieCharts 
          data={filteredData}
          selectedStudio={filters.studio}
          selectedFranchise={filters.franchise}
        />
      </main>
    </div>
  );
};

export default App;