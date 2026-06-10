import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { CheckCircle, Download, FileText, TrendingUp } from 'lucide-react';

const outcomeTargets = [
  { target: 'Weight Loss ≥5%', actual: '6.8%', status: 'Achieved', progress: 136 },
  { target: 'App Engagement ≥75%', actual: '84%', status: 'Achieved', progress: 112 },
  { target: 'Retention Rate ≥70%', actual: '75%', status: 'Achieved', progress: 107 },
  { target: 'Completion Rate ≥60%', actual: '72%', status: 'Achieved', progress: 120 },
  { target: 'Coaching Attendance ≥80%', actual: '89%', status: 'Achieved', progress: 111 },
];

const economicImpact = [
  { metric: 'Obesity-Related Conditions Prevented', value: '~38', description: 'Type 2 diabetes, cardiovascular events' },
  { metric: 'Healthcare Cost Avoidance', value: 'CHF 285,000', description: 'Estimated 5-year savings' },
  { metric: 'Cost per Successful Participant', value: 'CHF 1,180', description: 'Program cost efficiency' },
  { metric: 'Program ROI', value: '3.2x', description: 'Return on investment' },
];

export default function ContractPerformance() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Contract Performance</h1>
          <p className="text-muted-foreground mt-1">
            Contract-ready evidence and performance against agreed targets
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <FileText className="size-4 mr-2" />
            View Executive Summary
          </Button>
          <Button>
            <Download className="size-4 mr-2" />
            Export Contract Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="size-5 text-green-600" />
              All Targets Met
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700">5/5</div>
            <p className="text-sm text-muted-foreground mt-1">
              100% of contractual outcome targets achieved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">117%</div>
            <p className="text-sm text-muted-foreground mt-1">
              Average performance vs. targets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contract Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className="bg-green-600 text-white text-base px-4 py-1">
              In Good Standing
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">
              Eligible for renewal and performance bonuses
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Outcome Target Performance</CardTitle>
          <CardDescription>Contractual targets and actual results</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Target Metric</TableHead>
                <TableHead>Actual Result</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[300px]">Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {outcomeTargets.map((item) => (
                <TableRow key={item.target}>
                  <TableCell className="font-medium">{item.target}</TableCell>
                  <TableCell className="text-lg font-semibold text-green-600">{item.actual}</TableCell>
                  <TableCell>
                    <Badge className="bg-green-600 text-white">
                      <CheckCircle className="size-3 mr-1" />
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{item.progress}% of target</span>
                        <TrendingUp className="size-4 text-green-600" />
                      </div>
                      <Progress value={Math.min(item.progress, 100)} className="h-2" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Economic Impact Estimates</CardTitle>
          <CardDescription>Value demonstration using EDEN models</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {economicImpact.map((item) => (
              <div key={item.metric} className="border rounded-lg p-4">
                <div className="text-sm text-muted-foreground">{item.metric}</div>
                <div className="text-3xl font-bold mt-2 text-green-700">{item.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{item.description}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle>Executive Summary</CardTitle>
          <CardDescription>One-page contract performance overview</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Program Performance</h3>
            <p className="text-sm">
              The Oviva digital weight management program has successfully achieved all five contractual outcome targets,
              with an average performance of 117% against agreed benchmarks. All clinical effectiveness and engagement metrics
              exceeded minimum requirements, demonstrating strong program quality through flexible coaching delivery (in-person, video, phone) and digital tools.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Clinical Outcomes</h3>
            <p className="text-sm">
              Participants achieved an average weight loss of 6.8%, exceeding the contractual target of 5%
              by 36%. App engagement remained consistently high at 84%, with participants actively using the photo diary, chat feedback, and learning content.
              Program retention was maintained at 75%, and coaching session attendance reached 89%.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Economic Value</h3>
            <p className="text-sm">
              The program is estimated to have prevented approximately 38 obesity-related conditions (including type 2 diabetes and cardiovascular events),
              resulting in CHF 285,000 in avoided healthcare costs over a 5-year period.
              The program ROI of 3.2x demonstrates exceptional value for Swiss health insurance providers and employers.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Recommendation</h3>
            <p className="text-sm">
              <strong>Program renewal is strongly recommended.</strong> The evidence supports continued investment
              and potential expansion to additional high-risk populations. The provider has demonstrated consistent
              delivery of contractually agreed outcomes with strong economic value.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contract Actions</CardTitle>
          <CardDescription>Next steps for contracting and reimbursement</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full justify-start" variant="outline">
            <Download className="size-4 mr-2" />
            Download Full Contract Performance Report (PDF)
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <FileText className="size-4 mr-2" />
            Generate Executive Summary for Stakeholders
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <CheckCircle className="size-4 mr-2" />
            Submit Performance Evidence to Payer
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
