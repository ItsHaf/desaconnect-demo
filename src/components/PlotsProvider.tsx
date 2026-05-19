import { createContext, useContext, useState, type ReactNode } from 'react'
import { farmerPlots as initialPlots, type FarmerPlot } from '../data/mockData'

interface PlotsCtx {
  plots: FarmerPlot[]
  pendingPlots: FarmerPlot[]
  offlineMode: boolean
  addPlot: (plot: FarmerPlot) => void
  removePlot: (id: number) => void
  removePlotsByFarmer: (farmerId: string) => void
  addPendingPlot: (plot: FarmerPlot) => void
  syncPendingPlots: () => void
  setOfflineMode: (offline: boolean) => void
}

const PlotsContext = createContext<PlotsCtx>({
  plots: initialPlots,
  pendingPlots: [],
  offlineMode: false,
  addPlot: () => {},
  removePlot: () => {},
  removePlotsByFarmer: () => {},
  addPendingPlot: () => {},
  syncPendingPlots: () => {},
  setOfflineMode: () => {},
})

export function PlotsProvider({ children }: { children: ReactNode }) {
  const [plots, setPlots] = useState<FarmerPlot[]>(initialPlots)
  const [pendingPlots, setPendingPlots] = useState<FarmerPlot[]>([])
  const [offlineMode, setOfflineMode] = useState(false)
  const addPlot = (plot: FarmerPlot) => {
    setPlots((prev) => [...prev, plot])
  }

  const removePlot = (id: number) => {
    setPlots((prev) => prev.filter((plot) => plot.id !== id))
  }

  const removePlotsByFarmer = (farmerId: string) => {
    setPlots((prev) => prev.filter((plot) => plot.farmerId !== farmerId))
  }

  const addPendingPlot = (plot: FarmerPlot) => {
    setPendingPlots((prev) => [...prev, plot])
  }

  const syncPendingPlots = () => {
    setPendingPlots((prev) => {
      if (prev.length > 0) {
        setPlots((existing) => [...existing, ...prev])
      }
      return []
    })
  }

  return <PlotsContext.Provider value={{ plots, pendingPlots, offlineMode, addPlot, removePlot, removePlotsByFarmer, addPendingPlot, syncPendingPlots, setOfflineMode }}>{children}</PlotsContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePlots() {
  return useContext(PlotsContext)
}
