
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface DashboardStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  className?: string;
}

export default function DashboardStatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  badge,
  className = ''
}: DashboardStatCardProps) {
  return (
    <Card className={`shadow-material ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          {badge && (
            <Badge variant={badge.variant || 'default'} className="text-xs">
              {badge.text}
            </Badge>
          )}
          <Icon className="h-4 w-4 text-gray-500" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="text-2xl font-bold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          
          <div className="flex items-center justify-between">
            {subtitle && (
              <p className="text-xs text-gray-500">
                {subtitle}
              </p>
            )}
            
            {trend && (
              <div className={`flex items-center gap-1 text-xs ${
                trend.isPositive !== false ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.isPositive !== false ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span className="font-medium">
                  {Math.abs(trend.value)}%
                </span>
                <span className="text-gray-500">
                  {trend.label}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface DashboardStatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  className?: string;
  children?: React.ReactNode;
}

export function DashboardStatCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  trend, 
  className,
  children 
}: DashboardStatCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
        
        {trend && (
          <div className="flex items-center mt-2">
            <Badge 
              variant={trend.isPositive !== false ? "default" : "destructive"}
              className="text-xs"
            >
              {trend.isPositive !== false ? '+' : ''}{trend.value}%
            </Badge>
            <span className="text-xs text-muted-foreground ml-2">
              {trend.label}
            </span>
          </div>
        )}
        
        {children && (
          <div className="mt-4">
            {children}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
