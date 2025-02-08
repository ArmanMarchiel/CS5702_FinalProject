import React, { useEffect, useRef } from 'react';
import embed from 'vega-embed';

const MovieCharts = ({ data, selectedStudio, selectedFranchise }) => {
  const roiTimeRef = useRef(null);
  const franchiseBoxRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Process data for charts
    const roiTimeData = data.map(movie => {
      const date = new Date(movie['Release Date']);
      const budget = parseFloat(movie['Adjusted Budget'].replace(/[$,]/g, '')) || 0;
      const boxOffice = parseFloat(movie['Adjusted International Box Office'].replace(/[$,]/g, '')) || 0;
      const roi = budget > 0 ? ((boxOffice / (budget * 2.5) * 100) - 100) : -100;

      return {
        date: date,
        dateStr: date.toISOString(),
        year: date.getFullYear(),
        roi: roi,
        studio: movie['Studio'] || 'Unknown',
        franchise: movie['Franchise'] || 'Independent',
        title: movie['Movie Title'],
        budget: budget,
        boxOffice: boxOffice
      };
    });

    // Sort data chronologically
    roiTimeData.sort((a, b) => a.date - b.date);

    // Calculate x-axis range
    const years = roiTimeData.map(d => d.year);
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    const startYear = Math.floor(minYear / 5) * 5;
    const endYear = Math.ceil(maxYear / 5) * 5;

    // Scatter Plot Specification
    const roiTimeSpec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      description: 'ROI over time',
      width: 'container',
      height: 300,
      data: { values: roiTimeData },
      mark: {
        type: 'point',
        size: 100,
        opacity: 0.6
      },
      encoding: {
        x: {
          field: 'dateStr',
          type: 'temporal',
          title: 'Release Date',
          axis: { 
            format: '%Y',
            labelAngle: 0
          },
          scale: {
            domain: [`${startYear}-01-01`, `${endYear}-12-31`]
          }
        },
        y: {
          field: 'roi',
          type: 'quantitative',
          title: 'ROI (%)'
        },
        color: { 
          field: selectedFranchise ? 'franchise' : 'studio',
          type: 'nominal'
        },
        tooltip: [
          {field: 'title', type: 'nominal', title: 'Movie'},
          {field: 'date', type: 'temporal', title: 'Release Date', format: '%B %d, %Y'},
          {field: 'roi', type: 'quantitative', title: 'ROI', format: '.0f'},
          {field: 'budget', type: 'quantitative', title: 'Adjusted Budget', format: '$,.0f'},
          {field: 'boxOffice', type: 'quantitative', title: 'Adjusted Box Office', format: '$,.0f'},
          {field: 'studio', type: 'nominal', title: 'Studio'},
          {field: 'franchise', type: 'nominal', title: 'Franchise'}
        ]
      }
    };

    // Get all data for boxplot
    let boxPlotData;
    if (selectedStudio) {
      // If studio is selected, get all movies from that studio
      boxPlotData = roiTimeData.filter(movie => movie.studio === selectedStudio);
    } else {
      // If no studio selected, get all movies
      boxPlotData = roiTimeData;
    }

    // Box Plot Specification
    const boxPlotSpec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      description: 'ROI distribution',
      width: 'container',
      height: 300,
      data: { values: boxPlotData },
      mark: {
        type: 'boxplot',
        extent: 1.5,
        median: { color: 'white' }
      },
      encoding: {
        x: {
          // If studio selected, show franchises, otherwise show studios
          field: selectedStudio ? 'franchise' : 'studio',
          type: 'nominal',
          title: selectedStudio ? 'Franchise' : 'Studio',
          axis: { 
            labelAngle: -45,
            labelLimit: 200
          }
        },
        y: {
          field: 'roi',
          type: 'quantitative',
          title: 'ROI (%)',
          scale: { zero: false }
        },
        color: {
          field: selectedStudio ? 'franchise' : 'studio',
          type: 'nominal'
        }
      }
    };

    const renderCharts = async () => {
      try {
        if (roiTimeRef.current) {
          await embed(roiTimeRef.current, roiTimeSpec, {
            actions: false,
            renderer: 'svg'
          });
        }

        if (franchiseBoxRef.current) {
          await embed(franchiseBoxRef.current, boxPlotSpec, {
            actions: false,
            renderer: 'svg'
          });
        }
      } catch (error) {
        console.error('Error rendering charts:', error);
      }
    };

    renderCharts();
  }, [data, selectedStudio, selectedFranchise]);

  return (
    <div className="charts-container">
      <div className="chart-card">
        <h3>ROI Over Time</h3>
        <div ref={roiTimeRef} className="chart"></div>
      </div>
      
      <div className="chart-card">
        <h3>{selectedStudio ? `${selectedStudio} Franchise Performance` : 'Studio Performance'}</h3>
        <div ref={franchiseBoxRef} className="chart"></div>
      </div>
    </div>
  );
};

export default MovieCharts;