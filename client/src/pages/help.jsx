import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Radio, FileJson, Activity, Wifi, Cpu, HeartPulse } from "lucide-react";

const packetFields = [
  { name: "tskin", bytes: 4, type: "float32", desc: "Skin temperature (°C)" },
  { name: "tamb", bytes: 4, type: "float32", desc: "Ambient temperature (°C)" },
  { name: "tcore_raw", bytes: 4, type: "float32", desc: "Raw core estimate from on-device regression" },
  { name: "humidity", bytes: 4, type: "float32", desc: "Relative humidity (%)" },
  { name: "activity_index", bytes: 4, type: "float32", desc: "Normalized accelerometer activity index" },
  { name: "stress_prob", bytes: 4, type: "float32", desc: "ML stress probability 0.0-1.0" },
  { name: "stress_level", bytes: 1, type: "uint8", desc: "Encoded stress level: 0=low, 1=moderate, 2=high, 3=critical" },
  { name: "battery_voltage", bytes: 4, type: "float32", desc: "Li-Po battery voltage" },
  { name: "battery_pct", bytes: 1, type: "uint8", desc: "Battery percentage 0-100" },
  { name: "lat", bytes: 4, type: "float32", desc: "Latitude (decimal degrees)" },
  { name: "lng", bytes: 4, type: "float32", desc: "Longitude (decimal degrees)" },
  { name: "altitude", bytes: 4, type: "float32", desc: "GPS altitude (m)" },
  { name: "gps_valid", bytes: 1, type: "uint8", desc: "GPS fix validity flag" },
  { name: "hyperthermia", bytes: 1, type: "uint8", desc: "Hyperthermia flag (tcore > 40.5°C)" },
  { name: "device_id", bytes: 2, type: "uint16", desc: "LoRa node device ID" },
  { name: "seq", bytes: 4, type: "uint32", desc: "Sequence number for packet loss detection" },
  { name: "crc16", bytes: 2, type: "uint16", desc: "CCITT-FALSE checksum" },
];

const packetExample = {
  "tskin": 36.85,
  "tamb": 41.2,
  "tcore_raw": 39.15,
  "humidity": 28.5,
  "activity_index": 0.42,
  "stress_prob": 0.71,
  "stress_level": 2,
  "battery_voltage": 3.82,
  "battery_pct": 86,
  "lat": 24.4539,
  "lng": 54.3773,
  "altitude": 127,
  "gps_valid": 1,
  "hyperthermia": 0,
  "device_id": 1,
  "seq": 10492,
  "crc16": 48291
};

export default function Help() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 anime-fade-in">
      <div>
        <h1 className="text-3xl font-mono font-bold tracking-tight">HELP</h1>
        <p className="text-muted-foreground font-mono text-sm">LoRa packet documentation and system guides</p>
      </div>

      <Tabs defaultValue="packet" className="w-full">
        <TabsList className="font-mono">
          <TabsTrigger value="packet"><Radio className="h-4 w-4 mr-2" />LoRa Packet</TabsTrigger>
          <TabsTrigger value="gateway"><Wifi className="h-4 w-4 mr-2" />Gateway</TabsTrigger>
          <TabsTrigger value="model"><Cpu className="h-4 w-4 mr-2" />ML Model</TabsTrigger>
          <TabsTrigger value="about"><HelpCircle className="h-4 w-4 mr-2" />About</TabsTrigger>
        </TabsList>

        <TabsContent value="packet" className="space-y-4">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="font-mono text-lg flex items-center gap-2"><FileJson className="h-5 w-5" /> 915 MHz Private LoRa Packet Format</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 font-mono text-sm">
              <p>
                Each node transmits a fixed-length binary packet every 30 seconds (or on alert) at 915 MHz using the private DSM protocol.
                The gateway receives the packet, validates the CRC, and POSTs a JSON payload to <code className="bg-muted px-1 rounded">POST /api/telemetry</code>.
              </p>
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr><th className="text-left px-3 py-2">FIELD</th><th className="text-left px-3 py-2">BYTES</th><th className="text-left px-3 py-2">TYPE</th><th className="text-left px-3 py-2">DESCRIPTION</th></tr>
                  </thead>
                  <tbody>
                    {packetFields.map((f) => (
                      <tr key={f.name} className="border-t"><td className="px-3 py-2 font-bold">{f.name}</td><td className="px-3 py-2 text-muted-foreground">{f.bytes}</td><td className="px-3 py-2 text-muted-foreground">{f.type}</td><td className="px-3 py-2">{f.desc}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground">Total packet size: ~53 bytes payload plus LoRa header.</p>

              <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                <div className="text-xs text-muted-foreground mb-2 uppercase">Example JSON posted by gateway</div>
                <pre className="overflow-auto text-xs bg-background p-3 rounded border border-border">{JSON.stringify(packetExample, null, 2)}</pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gateway" className="space-y-4">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="font-mono text-lg flex items-center gap-2"><Wifi className="h-5 w-5" /> Gateway Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 font-mono text-sm">
              <p>The gateway is a Raspberry Pi or ESP32-S3 running the DSM relay service. It reads the LoRa module over SPI or UART and forwards packets to the API.</p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Frequency: 915 MHz (ISM band, region-specific)</li>
                <li>Spreading factor: SF7</li>
                <li>Bandwidth: 125 kHz</li>
                <li>Coding rate: 4/5</li>
                <li>TX power: 14 dBm (default), adjustable for battery saving</li>
                <li>API endpoint: <code className="bg-muted px-1 rounded">/api/telemetry</code></li>
              </ul>
              <p className="text-xs text-muted-foreground">Configure the gateway via environment variables or the serial CLI. See <code>.env.example</code> for server-side settings.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="model" className="space-y-4">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="font-mono text-lg flex items-center gap-2"><HeartPulse className="h-5 w-5" /> ML Model Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 font-mono text-sm">
              <p>On-device inference runs an XGBoost or RandomForest classifier/regressor trained on labelled heat-stress data.</p>
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline">tskin</Badge>
                <Badge variant="outline">tamb</Badge>
                <Badge variant="outline">humidity</Badge>
                <Badge variant="outline">activity_index</Badge>
                <Badge variant="outline">FEM-corrected Tcore</Badge>
              </div>
              <p className="text-muted-foreground">Stress thresholds:</p>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                <li>Low: stress_prob &lt; 0.35</li>
                <li>Moderate: 0.35 - 0.55</li>
                <li>High: 0.55 - 0.75</li>
                <li>Critical: &gt; 0.75 or tcore &gt; 40.5°C</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about" className="space-y-4">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="font-mono text-lg flex items-center gap-2"><Activity className="h-5 w-5" /> About DSM-CONTROL</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 font-mono text-sm">
              <p>Desert Stress Monitor (DSM-CONTROL) is a full-stack telemetry dashboard for monitoring camel and human stress in harsh environments.</p>
              <p>Built with React, Vite, Express, PostgreSQL, WebSocket, and Recharts.</p>
              <p className="text-xs text-muted-foreground">Set ADMIN_EMAIL and ADMIN_PASSWORD in .env to configure login.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
