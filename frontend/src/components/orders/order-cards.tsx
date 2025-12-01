"use client"

interface OrderCardProps {
  order: any
  isPast?: boolean
}

export default function OrderCard({ order, isPast = false }: OrderCardProps) {
  const statusColors = {
    Confirmado: "bg-success/20 text-success border-success/30",
    Pendiente: "bg-warning/20 text-warning border-warning/30",
    Finalizado: "bg-foreground-secondary/20 text-foreground-secondary border-foreground-secondary/30",
  }

  const statusColor = statusColors[order.status as keyof typeof statusColors] || statusColors["Pendiente"]

  return (
    <div className="bg-white rounded-lg shadow-card overflow-hidden hover:shadow-lg transition-smooth">
      <div className="flex gap-6 p-6">
        {/* Image */}
        <div className="w-48 h-32 rounded-lg overflow-hidden flex-shrink-0">
          <img src={order.image || "/placeholder.svg"} alt={order.dish} className="w-full h-full object-cover" />
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-lg font-bold text-foreground">{order.dish}</h3>
              <p className="text-sm text-foreground-secondary">
                {order.category} • {order.menu} • {order.sede}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColor}`}>{order.status}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-foreground-secondary">
              <p>{order.id}</p>
              <p className="text-error font-medium">
                {order.date} {order.time}
              </p>
            </div>
            {!isPast && (
              <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition-smooth text-sm">
                Ver detalles
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
