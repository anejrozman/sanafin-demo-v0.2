import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Download, FileText } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const populationMetrics = [
  { metric: 'Total Enrolled', value: '279', change: '+12%' },
  { metric: 'Currently Active', value: '248', change: '+8%' },
  { metric: 'Completion Rate', value: '72%', change: '+5%' },
  { metric: 'Retention Rate', value: '75%', change: '+3%' },
  { metric: 'Average Adherence', value: '84%', change: '+7%' },
];

const clinicalMetrics = [
  { metric: 'Mean Weight Reduction', baseline: '92.5 kg', followup: '86.2 kg', change: '-6.8%', status: 'Achieved' },
  { metric: 'Mean BMI Reduction', baseline: '32.4', followup: '30.2', change: '-2.2', status: 'Achieved' },
  { metric: 'App Engagement Rate', baseline: 'N/A', followup: '84%', change: '+84%', status: 'Excellent' },
  { metric: 'Coaching Session Attendance', baseline: 'N/A', followup: '89%', change: '+89%', status: 'Excellent' },
];

const progressData = [
  { month: 'Jan', weight: 92.5, bmi: 32.4, engagement: 72 },
  { month: 'Feb', weight: 91.0, bmi: 31.9, engagement: 78 },
  { month: 'Mar', weight: 89.5, bmi: 31.4, engagement: 81 },
  { month: 'Apr', weight: 88.1, bmi: 30.9, engagement: 83 },
  { month: 'May', weight: 87.0, bmi: 30.5, engagement: 84 },
  { month: 'Jun', weight: 86.2, bmi: 30.2, engagement: 84 },
];

export default function OutcomeReports() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Outcome Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive weight loss outcomes and digital engagement metrics for Oviva
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <FileText className="size-4 mr-2" />
            Generate Report
          </Button>
          <Button>
            <Download className="size-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Population Metrics</CardTitle>
          <CardDescription>Enrollment, completion, and engagement statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {populationMetrics.map((item) => (
                <TableRow key={item.metric}>
                  <TableCell className="font-medium">{item.metric}</TableCell>
                  <TableCell className="text-lg font-semibold">{item.value}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      {item.change}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Clinical Outcomes</CardTitle>
          <CardDescription>Key clinical metrics and achievement status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead>Baseline</TableHead>
                <TableHead>Follow-up</TableHead>
                <TableHead>Change</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clinicalMetrics.map((item) => (
                <TableRow key={item.metric}>
                  <TableCell className="font-medium">{item.metric}</TableCell>
                  <TableCell>{item.baseline}</TableCell>
                  <TableCell>{item.followup}</TableCell>
                  <TableCell className="font-semibold text-green-600">{item.change}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      {item.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Progress Over Time</CardTitle>
          <CardDescription>6-month trend of key clinical indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'App Engagement (%)', angle: 90, position: 'insideRight' }} />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="weight" stroke="#6366f1" strokeWidth={2} name="Weight (kg)" />
                <Line yAxisId="right" type="monotone" dataKey="engagement" stroke="#10b981" strokeWidth={2} name="App Engagement (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle>Key Insight</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            <strong>Participants completing the Oviva program achieved an average weight loss of 6.8% after six months.</strong>
            {' '}This exceeds the target reduction of 5% by 36%, demonstrating strong clinical effectiveness.
            App engagement remained consistently high at 84%, with participants actively using the photo diary, chat feedback, and learning content features throughout their journey.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
