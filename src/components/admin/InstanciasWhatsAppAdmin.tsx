
import React, { useState, useEffect } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QrCode, Copy, MoreHorizontal, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from '@/hooks/use-toast';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { CopyToClipboard } from 'react-copy-to-clipboard';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button as ShadButton } from "@/components/ui/button"
import { Input as ShadInput } from "@/components/ui/input"
import { InstanceBulkActions } from './InstanceBulkActions';
// Removido: componente de webhook não utilizado
import { UnifiedInstanceDashboard } from './UnifiedInstanceDashboard';
import { WhatsAppConnectionStatus } from '@/components/whatsapp/WhatsAppConnectionStatus';
import { QRCodeModal } from '@/components/whatsapp/QRCodeModal';

const statuses = [
  {
    value: "active",
    label: "Active",
  },
  {
    value: "inactive",
    label: "Inactive",
  },
]

const roleOptions = [
  {
    value: "admin",
    label: "Admin",
  },
  {
    value: "editor",
    label: "Editor",
  },
  {
    value: "viewer",
    label: "Viewer",
  },
]

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
})

interface Instancia {
  id: string;
  instance_name: string;
  numero?: string;
  status: string;
  ativo: boolean;
  empresa_nome?: string;
  webhook_status?: 'ativo' | 'inativo' | 'erro';
  qr_code?: string;
  created_at: string;
  updated_at: string;
}

interface InstanciasWhatsAppAdminProps {
  instancias: Instancia[];
}

export const InstanciasWhatsAppAdmin: React.FC<InstanciasWhatsAppAdminProps> = ({ instancias }) => {
  const [rowSelection, setRowSelection] = React.useState({})
  const [selectedInstanceName, setSelectedInstanceName] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const { toast } = useToast();

  const handleQRCode = (instanceName: string) => {
    setSelectedInstanceName(instanceName);
    setShowQRModal(true);
  };

  const columns = [
    {
      id: "select",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <Checkbox
          checked={rowSelection[row.id] === true}
          onCheckedChange={(value) =>
            setRowSelection(
              value
                ? {
                  ...rowSelection,
                  [row.id]: value,
                }
                : {
                  ...rowSelection,
                  [row.id]: false,
                }
            )
          }
          aria-label="Select row"
        />
      ),
    },
    {
      accessorKey: 'instance_name',
      header: 'Nome da Instância',
    },
    {
      accessorKey: 'numero',
      header: 'Número',
      cell: ({ row }) => {
        const numero = row.getValue("numero") as string;
        return numero || '-';
      },
    },
    {
      accessorKey: 'empresa_nome',
      header: 'Empresa',
      cell: ({ row }) => {
        const empresa = row.getValue("empresa_nome") as string;
        return empresa || '-';
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        let badgeVariant: "default" | "destructive" | "outline" | "secondary" = "secondary";
        
        if (status === "open" || status === "connected") {
          badgeVariant = "default";
        } else if (status === "disconnected" || status === "close") {
          badgeVariant = "destructive";
        } else if (status === "connecting") {
          badgeVariant = "outline";
        }
        
        const statusText = status === "open" ? "Conectado" : 
                          status === "disconnected" || status === "close" ? "Desconectado" :
                          status === "connecting" ? "Conectando" :
                          status === "qr" ? "QR Code" : status;
        
        return <Badge variant={badgeVariant}>{statusText}</Badge>;
      },
    },
    {
      accessorKey: 'connection',
      header: 'Conexão',
      cell: ({ row }) => {
        const instancia = row.original;
        return (
          <div className="flex items-center gap-2">
            <WhatsAppConnectionStatus 
              instanceId={instancia.instance_name}
              showDetails={false}
              className="shrink-0"
            />
            
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => handleQRCode(instancia.instance_name)}
              className="flex items-center gap-2"
            >
              <QrCode className="w-4 h-4" />
              QR Code
            </Button>
          </div>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const instancia = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(instancia.id)}>
                Copiar ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Ver detalhes
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ];

  const selectedInstances = Object.keys(rowSelection).filter(key => rowSelection[key]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Instâncias WhatsApp</h1>

        <div className="flex items-center space-x-2">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Instância
          </Button>
        </div>
      </div>

      <InstanceBulkActions 
        selectedInstances={selectedInstances} 
        instances={instancias.map(inst => ({
          id: inst.id,
          instance_name: inst.instance_name,
          status: inst.status,
          ativo: inst.ativo,
          empresa_nome: inst.empresa_nome,
          webhook_status: inst.webhook_status
        }))}
        onSelectionChange={setRowSelection}
        onRefresh={() => {}}
      />

      <DataTable columns={columns} data={instancias} />

      {selectedInstanceName && (
        <QRCodeModal
          instanceName={selectedInstanceName}
          isOpen={showQRModal}
          onClose={() => {
            setShowQRModal(false);
            setSelectedInstanceName(null);
          }}
        />
      )}

      {/* Removido: ImprovedWebhookCenter */}
      <UnifiedInstanceDashboard instances={instancias.map(inst => ({
        id: inst.id,
        instance_name: inst.instance_name,
        status: inst.status,
        empresa_nome: inst.empresa_nome,
        webhook_status: inst.webhook_status
      }))} />
    </div>
  );
};
