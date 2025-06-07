"use client"

import React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, Download, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { RespuestaBCRP } from "@/lib/types"

// Define la estructura de los datos para la tabla
export type IndicadorDato = {
  fecha: string
  codigo: string
  nombreIndicador: string
  valor: number
}

interface DatosIndicadorTableProps {
  datosIndicadores: Record<string, RespuestaBCRP>
}

export function DatosIndicadorTable({ datosIndicadores }: DatosIndicadorTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  // Preparar los datos para la tabla
  const data = React.useMemo(() => {
    const datosTabulares: IndicadorDato[] = [];
    
    Object.entries(datosIndicadores).forEach(([codigo, datos]) => {
      datos.datos.forEach(dato => {
        datosTabulares.push({
          fecha: dato.fecha,
          codigo,
          nombreIndicador: datos.nombre,
          valor: dato.valor
        });
      });
    });
    
    return datosTabulares;
  }, [datosIndicadores]);

  // Definir las columnas de la tabla
  const columns: ColumnDef<IndicadorDato>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Seleccionar todos"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Seleccionar fila"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "fecha",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Fecha
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => <div>{row.getValue("fecha")}</div>,
    },
    {
      accessorKey: "codigo",
      header: "Código",
      cell: ({ row }) => <div>{row.getValue("codigo")}</div>,
    },
    {
      accessorKey: "nombreIndicador",
      header: "Indicador",
      cell: ({ row }) => <div>{row.getValue("nombreIndicador")}</div>,
    },
    {
      accessorKey: "valor",
      header: ({ column }) => (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Valor
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const valor = parseFloat(row.getValue("valor"))
        
        // Formatear el valor con el separador adecuado
        const formatted = new Intl.NumberFormat("es-PE").format(valor)
        
        return <div className="text-right font-medium">{formatted}</div>
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  // Función para exportar los datos a CSV
  const exportarCSV = () => {
    // Seleccionar solo las filas filtradas y seleccionadas (o todas si no hay selección)
    const filasParaExportar = table.getFilteredSelectedRowModel().rows.length > 0
      ? table.getFilteredSelectedRowModel().rows
      : table.getFilteredRowModel().rows
    
    // Crear el contenido CSV
    const columnasCsv = columns
      .filter(col => col.id !== "select" && 'accessorKey' in col)
      .map(col => {
        const key = 'accessorKey' in col && typeof col.accessorKey === 'string' ? col.accessorKey : col.id
        return col.header && typeof col.header === "string" ? col.header : key
      })
    
    // Encabezados
    let csv = columnasCsv.join(',') + '\n'
    
    // Datos
    filasParaExportar.forEach(row => {
      const valores = columns
        .filter(col => col.id !== "select" && 'accessorKey' in col)
        .map(col => {
          const key = 'accessorKey' in col && typeof col.accessorKey === 'string' 
            ? col.accessorKey 
            : (col.id || ''); // Ensure we have a string, even if empty
          const valor = row.getValue(key)
          // Manejar comas y comillas en los valores
          if (typeof valor === 'string' && (valor.includes(',') || valor.includes('"'))) {
            return `"${valor.replace(/"/g, '""')}"`
          }
          return valor
        })
      csv += valores.join(',') + '\n'
    })
    
    // Crear y descargar el archivo
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', 'datos_indicadores_bcrp.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Filtrar por fecha..."
            value={(table.getColumn("fecha")?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              table.getColumn("fecha")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-2">
                Columnas <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id === "fecha" ? "Fecha" : 
                       column.id === "codigo" ? "Código" : 
                       column.id === "nombreIndicador" ? "Indicador" : 
                       column.id === "valor" ? "Valor" : column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <Button 
          variant="outline" 
          onClick={exportarCSV}
          className="flex items-center gap-1"
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No hay resultados.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-between py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} de{" "}
          {table.getFilteredRowModel().rows.length} fila(s) seleccionada(s).
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  )
} 