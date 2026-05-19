import { createContext, useContext, useState, type ReactNode } from 'react'
import { farmerPlots as initialPlots, type FarmerPlot } from '../data/mockData'

interface PlotsCtx {
  plots: FarmerPlot[]
  addPlot: (plot: FarmerPlot) => void
  removePlot: (id: number) => void
  removePlotsByFarmer: (farmerId: string) => void
}

const PlotsContext = createContext<PlotsCtx>({
  plots: initialPlots,
  addPlot: () => {},
  removePlot: () => {},
  removePlotsByFarmer: () => {},
})

export function PlotsProvider({ children }: { children: ReactNode }) {
  const [plots, setPlots] = useState<FarmerPlot[]>(initialPlots)

  const addPlot = (plot: FarmerPlot) => {
    setPlots((prev) => [...prev, plot])
  }

  const removePlot = (id: number) => {
    setPlots((prev) => prev.filter((plot) => plot.id !== id))
  }

  const removePlotsByFarmer = (farmerId: string) => {
    setPlots((prev) => prev.filter((plot) => plot.farmerId !== farmerId))
  }

  return <PlotsContext.Provider value={{ plots, addPlot, removePlot, removePlotsByFarmer }}>{children}</PlotsContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePlots() {
  return useContext(PlotsContext)
}
