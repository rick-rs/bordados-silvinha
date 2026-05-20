import { Pencil, Trash2 } from 'lucide-react';

import { IconButton } from '../buttons';
import type { Client } from '../../../services/clients';

type ClientTableRowProps = {
  client: Client;
  deletingId: number | null;
  onNavigate: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function ClientTableRow({
  client,
  deletingId,
  onNavigate,
  onEdit,
  onDelete,
}: ClientTableRowProps) {
  return (
    <tr
      className="cursor-pointer bg-white align-top transition hover:bg-primary/5"
      onClick={onNavigate}
    >
      <td className="px-4 py-3 font-extrabold text-ink">{client.nome}</td>
      <td className="px-4 py-3 text-slate-600">{client.telefone || '-'}</td>
      <td className="px-4 py-3 text-slate-600">{client.email || '-'}</td>
      <td className="px-4 py-3 text-slate-600">{client.cidade || '-'}</td>
      <td className="px-4 py-3 text-slate-600">{client.estado || '-'}</td>
      <td className="px-4 py-3 text-right">
        <IconButton
          aria-label={`Editar cliente ${client.nome}`}
          className="mr-1"
          onClick={(event) => {
            event.stopPropagation();
            onEdit();
          }}
          title="Editar cliente"
        >
          <Pencil aria-hidden className="h-4 w-4" />
        </IconButton>
        <IconButton
          aria-label={`Excluir cliente ${client.nome}`}
          disabled={deletingId === client.id}
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          title="Excluir cliente"
          tone="danger"
        >
          <Trash2 aria-hidden className="h-4 w-4" />
        </IconButton>
      </td>
    </tr>
  );
}
