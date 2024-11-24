import { Site, Config } from '../types';
import { useState } from 'react';
import { CardHeader, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button, Input } from '@/components/ui/enhanced-components'
import { Server, Activity, Building, Trash2 } from 'lucide-react';
import { calculateWeightedScore } from '../utils';
import { calculateCollectors } from '../utils';
import { DeviceTypeCard } from './DeviceTypeCard';
import { LogsInput } from './LogsInput';
import { CollectorVisualization } from './CollectorVisualization';
import EnhancedCard from '@/components/ui/enhanced-card';
import ConfigurationActions from './ConfigurationActions';
import { Plus, ChevronUp, ChevronDown, HardDrive, HelpCircle, Bolt } from 'lucide-react';
import { FirstTimeVisit } from './FirstTimeVisit';
import DeploymentNameInput from './DeploymentNameInput';

interface SiteConfigurationProps {
    sites: Site[];
    onUpdateSites: (sites: Site[]) => void;
    onUpdateConfig: (config: Config) => void;
    config: Config;
    onSiteExpand: (expandedSites: Set<number>) => void;
    expandedSites: Set<number>;
}

export const SiteConfiguration = ({ sites, onUpdateSites, onUpdateConfig, config, onSiteExpand }: SiteConfigurationProps) => {
    const resetSite = (index: number, type: string) => {
        const newSites = [...sites];
        if (type === "devices") {
            newSites[index].devices = Object.fromEntries(
                Object.entries(config.deviceDefaults).map(([type, data]) => [
                    type,
                    { ...data, count: 0 },
                ])
            );
        } else if (type === "logs") {
            newSites[index].logs = {
                netflow: 0,
                syslog: 0,
                traps: 0,
            };
        }
        onUpdateSites(newSites);
    };

    const [helpDialogOpen, setHelpDialogOpen] = useState(false);

    const getSiteResults = (site: Site) => {
        const totalWeight = calculateWeightedScore(
            site.devices,
            config.methodWeights
        );
        const totalEPS = Object.values(site.logs).reduce(
            (sum, eps) => sum + eps,
            0
        );
        return calculateCollectors(totalWeight, totalEPS, config.maxLoad, config);
    };

    const calculateAverageLoad = (collectors: Array<any>) => {
        const primaryCollectors = collectors.filter((c) => c.type === "Primary");
        if (primaryCollectors.length === 0) return 0;
        return Math.round(
            primaryCollectors.reduce((sum, c) => sum + c.load, 0) /
            primaryCollectors.length
        );
    };

    const [expandedSites, setExpandedSites] = useState(new Set([0])); // Start with first site expanded

    const toggleSite = (index: number) => {
        setExpandedSites((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const addSite = () => {
        const newSite = {
            name: `Site ${sites.length + 1}`,
            devices: Object.fromEntries(
                Object.entries(config.deviceDefaults).map(([type, data]) => [
                    type,
                    { ...data, count: 0 },
                ])
            ),
            logs: {
                netflow: 0,
                syslog: 0,
                traps: 0,
            },
        };

        // Clear all expanded sites
        setExpandedSites(new Set());

        // Add new site and expand only it
        onUpdateSites([...sites, newSite]);

        // After a brief delay, expand the new site
        setTimeout(() => {
            setExpandedSites(new Set([sites.length]));
        }, 100);
    };

    const deleteSite = (index: number) => {
        onUpdateSites(sites.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-8 min-h-[900px]">
            <FirstTimeVisit
                isOpen={helpDialogOpen}
                onOpenChange={setHelpDialogOpen}
            />
            <div className="flex items-center justify-between">
                <ConfigurationActions
                    sites={sites}
                    config={config}
                    onUpdateSites={onUpdateSites}
                    onUpdateConfig={onUpdateConfig}
                    onSiteExpand={setExpandedSites}
                />
                <div className="flex items-center gap-3">
                    <Button
                        onClick={addSite}
                        className="bg-[#040F4B] hover:bg-[#0A1B6F] text-white gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add New Site
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setHelpDialogOpen(true)}
                        className="gap-2"
                    >
                        <HelpCircle className="w-4 h-4" />
                        Help Guide
                    </Button>
                    {sites.length > 0 && (
                        <Button
                            onClick={() => {
                                const allSiteIndexes = Array.from({ length: sites.length }, (_, i) => i);
                                // If all sites are expanded, collapse all. Otherwise, expand all
                                const shouldExpandAll = expandedSites.size !== sites.length;
                                setExpandedSites(new Set(shouldExpandAll ? allSiteIndexes : []));
                            }}
                            variant="outline"
                            className="gap-2"
                        >
                            {expandedSites.size === sites.length ? (
                                <>
                                    <ChevronUp className="w-4 h-4" />
                                    Collapse All
                                </>
                            ) : (
                                <>
                                    <ChevronDown className="w-4 h-4" />
                                    Expand All
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>
            <DeploymentNameInput
    value={config.deploymentName}
    onChange={(name) => onUpdateConfig({ ...config, deploymentName: name })}
    onUpdateConfig={onUpdateConfig}
    onUpdateSites={onUpdateSites}
    onSiteExpand={onSiteExpand}
    config={config}
/>
            {sites.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-lg border-2 border-dashed border-gray-200">
                    <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                        <Building className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Sites Configured</h3>
                    <p className="text-gray-500 text-center mb-6">Get started by adding your first site to calculate collector requirements.</p>
                    <Button
                        onClick={addSite}
                        className="bg-[#040F4B] hover:bg-[#0A1B6F] text-white gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add First Site
                    </Button>
                </div>
            ) : (
                sites.map((site, index) => (
                    <EnhancedCard key={index} className="bg-white border border-gray-200 hover:shadow-md transition-all duration-300">
                        <CardHeader
                            className="flex flex-row items-center justify-between cursor-pointer hover:bg-slate-50"
                            onClick={() => toggleSite(index)}
                        >
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center">
                                        <Building className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            value={site.name}
                                            onChange={(e) => {
                                                e.stopPropagation();
                                                const newSites = [...sites];
                                                newSites[index].name = e.target.value;
                                                onUpdateSites(newSites);
                                            }}
                                            className="w-64"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <div className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${expandedSites.has(index) ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`}>
                                            {expandedSites.has(index) ? "▼" : "▶"}
                                        </div>
                                    </div>
                                </div>

                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
                                    <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                                        <Server className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <span className="text-sm font-medium text-gray-600">
                                        x{getSiteResults(site).polling.collectors.filter(c => c.type === "Primary").length} Polling
                                    </span>
                                    {config.enablePollingFailover && (
                                        <span className="text-sm text-gray-500">
                                            + 1 Redundant
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg">
                                        <div className="w-5 h-5 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                                            <Activity className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <span className="text-sm font-medium text-gray-600">
                                            x{getSiteResults(site).logs.collectors.filter(c => c.type === "Primary").length} Netflow/Logs
                                        </span>
                                        {config.enableLogsFailover && (
                                            <span className="text-sm text-gray-500">
                                                + 1 N+1
                                            </span>
                                        )}
                                    </div>

                                    <div className={`px-3 py-1.5 rounded-lg flex items-center gap-2 ${calculateAverageLoad(getSiteResults(site).polling.collectors) >= 80
                                        ? "bg-red-50 text-red-700 border border-red-200"
                                        : calculateAverageLoad(getSiteResults(site).polling.collectors) >= 60
                                            ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
                                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        }`}>
                                        <span className="text-sm font-medium">Avg Load</span>
                                        <span className="text-sm">
                                            {calculateAverageLoad(getSiteResults(site).polling.collectors)}%
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                                        <HardDrive className="w-5 h-5 text-blue-600" />
                                        <span className="text-sm font-medium text-blue-700">
                                            {Object.values(site.devices).reduce(
                                                (sum, device) => sum + (device.count || 0),
                                                0
                                            )}{" "}
                                            Devices
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    variant="destructive"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteSite(index);
                                    }}
                                    className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Remove Site
                                </Button>
                            </div>
                        </CardHeader>
                        {expandedSites.has(index) && (
                            <CardContent>
                                <Tabs defaultValue="devices">
                                    <TabsList className="bg-white border border-gray-200 p-1 rounded-lg">
                                        <TabsTrigger className="rounded px-4 py-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700" value="devices">Devices</TabsTrigger>
                                        <TabsTrigger className="rounded px-4 py-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700" value="logs">Logs & NetFlow</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="devices" className="mt-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-semibold">Devices</h3>
                                            <Button
                                                onClick={() => resetSite(index, "devices")}
                                                variant="outline"
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                Reset Devices
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            {Object.entries(site.devices).map(([type, data]) => (
                                                <DeviceTypeCard
                                                    key={type}
                                                    type={type}
                                                    data={data}
                                                    methodWeights={config.methodWeights}
                                                    onUpdate={(newCount) => {
                                                        const newSites = [...sites];
                                                        newSites[index].devices[type].count = newCount;
                                                        onUpdateSites(newSites);
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="logs" className="mt-4">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-semibold">Logs & NetFlow</h3>
                                            <Button
                                                onClick={() => resetSite(index, "logs")}
                                                variant="outline"
                                                className="text-red-600 hover:text-red-700"
                                            >
                                                Reset Logs
                                            </Button>
                                        </div>
                                        <LogsInput
                                            logs={site.logs}
                                            onUpdate={(newLogs) => {
                                                const newSites = [...sites];
                                                newSites[index].logs = newLogs;
                                                onUpdateSites(newSites);
                                            }}
                                        />
                                    </TabsContent>
                                </Tabs>

                                <div className="mt-8">
                                    <h3 className="text-xl font-bold text-white-900 mb-4">
                                        {site.name} Collectors
                                    </h3>
                                    <CollectorVisualization
                                        polling={getSiteResults(site).polling}
                                        logs={getSiteResults(site).logs}
                                        totalPollingLoad={calculateWeightedScore(site.devices, config.methodWeights)}
                                        totalLogsLoad={Object.values(site.logs).reduce((sum, eps) => sum + eps, 0)}
                                    />
                                </div>
                            </CardContent>
                        )}
                    </EnhancedCard>
                ))
            )}
        </div>
    );
};

export default SiteConfiguration;