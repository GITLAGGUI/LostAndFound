import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface PieChartProps {
  data: {
    item: { lost: number; found: number }
    person: { lost: number; found: number }
    pet: { lost: number; found: number }
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function RechartsPieChart({ data }: PieChartProps) {
  // Transform the data for recharts
  const chartData = [
    { name: 'Lost Items', value: data.item.lost, category: 'item' },
    { name: 'Found Items', value: data.item.found, category: 'item' },
    { name: 'Lost Persons', value: data.person.lost, category: 'person' },
    { name: 'Found Persons', value: data.person.found, category: 'person' },
    { name: 'Lost Pets', value: data.pet.lost, category: 'pet' },
    { name: 'Found Pets', value: data.pet.found, category: 'pet' }
  ].filter(item => item.value > 0) // Only show categories with data

  return (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={120}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}