import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const riskLevelCohorts = [
  { cohort: 'Overweight (BMI 25-30)', participants: 78, weightChange: '-4.2%', bmiChange: '-1.3', retention: '82%', improvement: '1.2x' },
  { cohort: 'Obese Class I (BMI 30-35)', participants: 134, weightChange: '-6.5%', bmiChange: '-2.1', retention: '76%', improvement: '1.8x' },
  { cohort: 'Obese Class II+ (BMI >35)', participants: 67, weightChange: '-8.9%', bmiChange: '-3.2', retention: '71%', improvement: '2.4x' },
];

const deliveryMethodCohorts = [
  { cohort: 'In-Person Coaching', participants: 89, weightChange: '-7.2%', appUsage: '78%', retention: '82%', improvement: '1.9x' },
  { cohort: 'Video Call Coaching', participants: 134, weightChange: '-6.8%', appUsage: '85%', retention: '76%', improvement: '1.8x' },
  { cohort: 'Phone Coaching', participants: 56, weightChange: '-5.9%', appUsage: '81%', retention: '69%', improvement: '1.5x' },
];

const engagementCohorts = [
  { cohort: 'High App Usage (Photo Diary Daily)', participants: 167, weightChange: '-8.1%', coachingAttendance: '94%', retention: '89%', improvement: '2.5x' },
  { cohort: 'Medium App Usage (3-5x/week)', participants: 78, weightChange: '-5.8%', coachingAttendance: '82%', retention: '72%', improvement: '1.6x' },
  { cohort: 'Low App Usage (<3x/week)', participants: 34, weightChange: '-3.2%', coachingAttendance: '64%', retention: '48%', improvement: '0.9x' },
];

const comparisonData = [
  { name: 'Obese II+', weightLoss: 8.9, bmiReduction: 3.2, participants: 67 },
  { name: 'Obese I', weightLoss: 6.5, bmiReduction: 2.1, participants: 134 },
  { name: 'Overweight', weightLoss: 4.2, bmiReduction: 1.3, participants: 78 },
];

export default function CohortAnalysis() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1>Cohort Analysis</h1>
        <p className="text-muted-foreground mt-1">
          Patient segmentation by BMI category, delivery method, and app engagement
        </p>
      </div>

      <Card className="bg-amber-50 border-amber-200">
        <CardHeader>
          <CardTitle>Key Finding</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            <strong>Participants with BMI &gt;35 (Obese Class II+) achieved 2.4x greater weight loss than overweight participants.</strong>
            {' '}This demonstrates that Oviva's digital coaching approach is particularly effective for higher-BMI populations, which is critical for demonstrating value to insurance providers and employers.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue="risk" className="space-y-4">
        <TabsList>
          <TabsTrigger value="risk">By BMI Category</TabsTrigger>
          <TabsTrigger value="bmi">By Delivery Method</TabsTrigger>
          <TabsTrigger value="engagement">By App Engagement</TabsTrigger>
        </TabsList>

        <TabsContent value="risk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cohort Comparison by BMI Category</CardTitle>
              <CardDescription>Outcomes segmented by baseline BMI</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cohort</TableHead>
                    <TableHead className="text-right">Participants</TableHead>
                    <TableHead className="text-right">Weight Loss</TableHead>
                    <TableHead className="text-right">BMI Change</TableHead>
                    <TableHead className="text-right">Retention</TableHead>
                    <TableHead className="text-right">Improvement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {riskLevelCohorts.map((item) => (
                    <TableRow key={item.cohort}>
                      <TableCell className="font-medium">{item.cohort}</TableCell>
                      <TableCell className="text-right">{item.participants}</TableCell>
                      <TableCell className="text-right font-semibold text-green-600">{item.weightChange}</TableCell>
                      <TableCell className="text-right font-semibold text-green-600">{item.bmiChange}</TableCell>
                      <TableCell className="text-right">{item.retention}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                          {item.improvement}
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
              <CardTitle>Outcome Distribution by BMI Category</CardTitle>
              <CardDescription>Visual comparison of weight loss and BMI reduction</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: 'Reduction', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="weightLoss" fill="#6366f1" name="Weight Loss (%)" />
                    <Bar dataKey="bmiReduction" fill="#10b981" name="BMI Reduction" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bmi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cohort Comparison by Delivery Method</CardTitle>
              <CardDescription>Outcomes by coaching modality (in-person, video, phone)</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cohort</TableHead>
                    <TableHead className="text-right">Participants</TableHead>
                    <TableHead className="text-right">Weight Loss</TableHead>
                    <TableHead className="text-right">App Usage</TableHead>
                    <TableHead className="text-right">Retention</TableHead>
                    <TableHead className="text-right">Improvement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveryMethodCohorts.map((item) => (
                    <TableRow key={item.cohort}>
                      <TableCell className="font-medium">{item.cohort}</TableCell>
                      <TableCell className="text-right">{item.participants}</TableCell>
                      <TableCell className="text-right font-semibold text-green-600">{item.weightChange}</TableCell>
                      <TableCell className="text-right font-semibold text-green-600">{item.appUsage}</TableCell>
                      <TableCell className="text-right">{item.retention}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                          {item.improvement}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cohort Comparison by App Engagement</CardTitle>
              <CardDescription>Outcomes segmented by photo diary and app usage frequency</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cohort</TableHead>
                    <TableHead className="text-right">Participants</TableHead>
                    <TableHead className="text-right">Weight Loss</TableHead>
                    <TableHead className="text-right">Coaching Attendance</TableHead>
                    <TableHead className="text-right">Retention</TableHead>
                    <TableHead className="text-right">Improvement</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {engagementCohorts.map((item) => (
                    <TableRow key={item.cohort}>
                      <TableCell className="font-medium">{item.cohort}</TableCell>
                      <TableCell className="text-right">{item.participants}</TableCell>
                      <TableCell className="text-right font-semibold text-green-600">{item.weightChange}</TableCell>
                      <TableCell className="text-right font-semibold text-green-600">{item.coachingAttendance}</TableCell>
                      <TableCell className="text-right">{item.retention}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                          {item.improvement}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle>Insight: App Engagement Drives Outcomes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Participants using the Oviva photo diary daily achieved 2.5x better weight loss outcomes compared to low-usage participants,
                with significantly higher retention rates (89% vs. 48%). This demonstrates the critical importance of digital engagement—through
                the app's photo diary, chat feedback, and learning content—for achieving optimal clinical results in remote weight management.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
