import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface BarChartProps {
  data: Array<{
    month: string
    lost: number
    found: number
    matches: number
  }>
}

export default function RechartsBarChart({ data }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="lost" fill="#ef4444" name="Lost Items" />
        <Bar dataKey="found" fill="#22c55e" name="Found Items" />
        <Bar dataKey="matches" fill="#3b82f6" name="Matches" />
      </BarChart>
    </ResponsiveContainer>
  )
}