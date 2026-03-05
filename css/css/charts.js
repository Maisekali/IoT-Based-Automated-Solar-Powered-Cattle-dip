class ChartManager {
  constructor() {
    this.charts = {};
    this.dataHistory = {
      labels: [],
      battery: [],
      solar: [],
      tank: [],
      temperature: [],
      flow: [],
      total: []
    };
    this.maxDataPoints = 50;
  }

  initGauges() {
    // Temperature Gauge
    const tempCtx = document.getElementById('tempGauge').getContext('2d');
    this.charts.temp = new Chart(tempCtx, {
      type: 'doughnut',
       {
        labels: ['Temperature', 'Remaining'],
        datasets: [{
           [0, 100],
          backgroundColor: ['#FF9800', '#E0E0E0'],
          borderWidth: 0,
          circumference: 180,
          rotation: 270
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        cutout: '75%'
      }
    });

    // Flow Rate Gauge
    const flowCtx = document.getElementById('flowGauge').getContext('2d');
    this.charts.flow = new Chart(flowCtx, {
      type: 'doughnut',
       {
        labels: ['Flow Rate', 'Remaining'],
        datasets: [{
           [0, 100],
          backgroundColor: ['#2196F3', '#E0E0E0'],
          borderWidth: 0,
          circumference: 180,
          rotation: 270
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        cutout: '75%'
      }
    });

    // Total Sprayed Gauge
    const totalCtx = document.getElementById('totalGauge').getContext('2d');
    this.charts.total = new Chart(totalCtx, {
      type: 'doughnut',
       {
        labels: ['Total', 'Remaining'],
        datasets: [{
           [0, 100],
          backgroundColor: ['#4CAF50', '#E0E0E0'],
          borderWidth: 0,
          circumference: 180,
          rotation: 270
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: false }
        },
        cutout: '75%'
      }
    });
  }

  initHistoryChart() {
    const ctx = document.getElementById('historyChart').getContext('2d');
    this.charts.history = new Chart(ctx, {
      type: 'line',
       {
        labels: this.dataHistory.labels,
        datasets: [
          {
            label: 'Battery (V)',
             this.dataHistory.battery,
            borderColor: '#FF9800',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            tension: 0.4,
            yAxisID: 'y'
          },
          {
            label: 'Tank Level (%)',
             this.dataHistory.tank,
            borderColor: '#2196F3',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            tension: 0.4,
            yAxisID: 'y1'
          },
          {
            label: 'Temperature (°C)',
            data: this.dataHistory.temperature,
            borderColor: '#F44336',
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            tension: 0.4,
            yAxisID: 'y'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 12,
              font: { size: 11 }
            }
          }
        },
        scales: {
          x: {
            display: true,
            grid: { display: false },
            ticks: { maxTicksLimit: 6 }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            grid: { color: 'rgba(0,0,0,0.05)' }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            grid: { drawOnChartArea: false },
            min: 0,
            max: 100
          }
        }
      }
    });
  }

  updateGauge(chart, value, maxValue) {
    const percentage = Math.min((value / maxValue) * 100, 100);
    chart.data.datasets[0].data = [percentage, 100 - percentage];
    chart.update('none'); // 'none' for performance
  }

  updateTemperature(value) {
    // Max temp expected: 50°C
    this.updateGauge(this.charts.temp, value, 50);
    document.getElementById('tempValue').textContent = `${value.toFixed(1)}°C`;
  }

  updateFlowRate(value) {
    // Max flow: 10 L/min
    this.updateGauge(this.charts.flow, value, 10);
    document.getElementById('flowValue').textContent = `${value.toFixed(1)} L/min`;
  }

  updateTotalSprayed(value) {
    // Max expected per day: 500L
    this.updateGauge(this.charts.total, value, 500);
    document.getElementById('totalValue').textContent = `${value.toFixed(1)} L`;
  }

  addDataPoint(data) {
    const now = new Date();
    const timeLabel = now.getHours() + ':' + now.getMinutes().toString().padStart(2, '0');

    this.dataHistory.labels.push(timeLabel);
    this.dataHistory.battery.push(data.battery_voltage || 0);
    this.dataHistory.tank.push(data.tank_level || 0);
    this.dataHistory.temperature.push(data.temperature || 0);
    this.dataHistory.flow.push(data.flow_rate || 0);
    this.dataHistory.total.push(data.total_liters || 0);

    // Keep only last N points
    if (this.dataHistory.labels.length > this.maxDataPoints) {
      Object.keys(this.dataHistory).forEach(key => {
        this.dataHistory[key].shift();
      });
    }

    // Update chart
    if (this.charts.history) {
      this.charts.history.data.labels = this.dataHistory.labels;
      this.charts.history.data.datasets[0].data = this.dataHistory.battery;
      this.charts.history.data.datasets[1].data = this.dataHistory.tank;
      this.charts.history.data.datasets[2].data = this.dataHistory.temperature;
      this.charts.history.update('none');
    }
  }

  destroy() {
    Object.values(this.charts).forEach(chart => {
      chart.destroy();
    });
  }
}

window.ChartManager = ChartManager;
