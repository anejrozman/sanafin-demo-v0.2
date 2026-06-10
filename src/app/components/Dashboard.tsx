import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Users, Activity, Target, Award } from 'lucide-react';

const outcomeData = [
  { name: 'Weight Loss ≥5%', value: 215, percentage: 77 },
  { name: 'BMI Improved', value: 234, percentage: 84 },
  { name: 'Goal Achieved', value: 198, percentage: 71 },
];

const engagementData = [
  { metric: 'Photo Diary', usage: 89, participants: 279 },
  { metric: 'Chat Active', usage: 82, participants: 279 },
  { metric: 'Learning Content', usage: 76, participants: 279 },
];

const outcomesPieData = [
  { name: 'On Track', value: 248, color: '#10b981' },
  { name: 'At Risk', value: 31, color: '#f59e0b' },
];

export default function Dashboard() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1>Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Real-time visibility into Oviva digital weight management program performance
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Patients</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">279</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="size-3 text-green-600" />
              <span className="text-green-600">+12%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <Target className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">72%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="size-3 text-green-600" />
              <span className="text-green-600">+5%</span> from last quarter
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Weight Loss</CardTitle>
            <Activity className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6.8%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="size-3 text-green-600" />
              Target: 5%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
            <Award className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">75%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="size-3 text-green-600" />
              Above 70% target
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Outcome Targets</CardTitle>
            <CardDescription>Progress towards clinical outcome goals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Weight Loss ≥5%</span>
                <span className="text-sm text-muted-foreground">215/279 (77%)</span>
              </div>
              <Progress value={77} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">App Engagement ≥75%</span>
                <span className="text-sm text-muted-foreground">235/279 (84%)</span>
              </div>
              <Progress value={84} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Retention Target ≥70%</span>
                <span className="text-sm text-muted-foreground">75%</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Outcome Overview</CardTitle>
            <CardDescription>Distribution of participant outcomes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={outcomesPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {outcomesPieData.map((entry, index) => (
                      <Cell key={`cell-${entry.name}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-green-600" />
                <span className="text-sm">On Track (248)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-amber-600" />
                <span className="text-sm">At Risk (31)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>App Engagement Metrics</CardTitle>
          <CardDescription>Digital tool utilization across participant base</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engagementData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis label={{ value: 'Usage (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="usage" fill="#6366f1" name="Usage Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Verified Outcomes</CardTitle>
            <CardDescription>Contract-ready evidence</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Weight Loss Target</span>
                <Badge variant="secondary" className="bg-green-100 text-green-700">Achieved</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">App Engagement</span>
                <Badge variant="secondary" className="bg-green-100 text-green-700">Achieved</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Program Completion</span>
                <Badge variant="secondary" className="bg-green-100 text-green-700">Achieved</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Economic Impact</CardTitle>
            <CardDescription>Estimated healthcare savings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">Obesity-Related Conditions Prevented</div>
                <div className="text-2xl font-bold mt-1">~38</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Est. Cost Avoidance</div>
                <div className="text-2xl font-bold mt-1">CHF 285K</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Program Efficiency</CardTitle>
            <CardDescription>Cost and engagement metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">Cost per Success</div>
                <div className="text-2xl font-bold mt-1">$1,270</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Program ROI</div>
                <div className="text-2xl font-bold mt-1 text-green-600">2.8x</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
