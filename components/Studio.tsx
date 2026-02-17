
'use client'
import { useEffect, useRef, useState } from 'react'
import { fabric } from 'fabric'
import { jsPDF } from 'jspdf'
import JSZip from 'jszip'

const WIDTH = 1400
const HEIGHT = 990

export default function Studio() {

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fabricRef = useRef<fabric.Canvas | null>(null)
  const [fontSize, setFontSize] = useState(48)
  const [color, setColor] = useState('#8B6B2E')
  const [fontFamily, setFontFamily] = useState('serif')
  const [names, setNames] = useState('')
  const [layouts, setLayouts] = useState<string[]>([])

  useEffect(() => {
    if (!canvasRef.current || fabricRef.current) return
    const canvas = new fabric.Canvas(canvasRef.current, { width: WIDTH, height: HEIGHT })
    fabricRef.current = canvas

    // Background (locked)
    fabric.Image.fromURL('/default-bg.png', img => {
      img.scaleToWidth(WIDTH)
      img.scaleToHeight(HEIGHT)
      img.selectable = false
      img.evented = false
      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas))
    })

    // Editable Layers
    addText("CERTIFICATE", WIDTH / 2, 180, 70, true)
    addText("Of Achievement", WIDTH / 2, 250, 36, false)
    addText("Kalsubai Trek - Highest Peak of Maharashtra", WIDTH / 2, 320, 28, false)
    addText("This Certificate Is Proudly Presented To", WIDTH / 2, 380, 26, false)

    const nameField = new fabric.Textbox("Milind gaude", {
      left: WIDTH / 2 - 400,
      top: 430,
      width: 800,
      fontSize: 60,
      textAlign: 'center',
      fill: '#8B6B2E',
      fontWeight: 'bold'
    })
    nameField.set('customType', 'name')
    canvas.add(nameField)

    addText("This certificate is awarded for successfully completing the trek and demonstrating outstanding perseverance and adventure spirit.", WIDTH / 2, 520, 22, false)

    addText("21/08/2025", WIDTH / 2 - 400, 650, 26, false)
    addText("Milind Gaude", WIDTH - 350, 650, 28, false)
    addText("Head Operations", WIDTH - 350, 690, 22, false)

    loadLayouts()
  }, [])

  const addText = (text: string, x: number, y: number, size: number, bold: boolean) => {
    const t = new fabric.Textbox(text, {
      left: x - 400,
      top: y,
      width: 800,
      fontSize: size,
      fill: '#000',
      textAlign: 'center',
      fontWeight: bold ? 'bold' : 'normal'
    })
    fabricRef.current?.add(t)
  }

  const applyStyle = () => {
    const obj: any = fabricRef.current?.getActiveObject()
    if (!obj) return
    obj.set({ fontSize, color, fill: color, fontFamily })
    fabricRef.current?.renderAll()
  }

  const uploadLogo = (e: any) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = f => {
      fabric.Image.fromURL(f.target?.result as string, img => {
        img.left = WIDTH - 300
        img.top = 60
        img.scaleToWidth(180)
        fabricRef.current?.add(img)
      })
    }
    reader.readAsDataURL(file)
  }

  const uploadSignature = (e: any) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = f => {
      fabric.Image.fromURL(f.target?.result as string, img => {
        img.left = WIDTH - 400
        img.top = 720
        img.scaleToWidth(200)
        fabricRef.current?.add(img)
      })
    }
    reader.readAsDataURL(file)
  }

  const enableDraw = () => { if (fabricRef.current) fabricRef.current.isDrawingMode = true }
  const disableDraw = () => { if (fabricRef.current) fabricRef.current.isDrawingMode = false }

  const saveLayout = () => {
    if (!fabricRef.current) return
    const name = prompt("Layout name?")
    if (!name) return
    localStorage.setItem("layout_" + name, JSON.stringify(fabricRef.current.toJSON()))
    loadLayouts()
  }

  const loadLayouts = () => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith("layout_"))
    setLayouts(keys.map(k => k.replace("layout_", "")))
  }

  const loadLayout = (name: string) => {
    const data = localStorage.getItem("layout_" + name)
    if (!data || !fabricRef.current) return
    fabricRef.current.loadFromJSON(data, () => fabricRef.current?.renderAll())
  }

  const exportCertificates = async () => {
    if (!fabricRef.current) return
    const list = names.split('\n').map(n => n.trim()).filter(Boolean)
    if (!list.length) return alert("Enter at least one name")

    if (list.length === 1) {
      const blob = await generatePDF(list[0])
      download(blob, list[0] + ".pdf")
      return
    }

    const zip = new JSZip()
    for (const n of list) {
      const blob = await generatePDF(n)
      zip.file(n + ".pdf", blob)
    }
    const content = await zip.generateAsync({ type: "blob" })
    download(content, "certificates.zip")
  }

  const generatePDF = async (name: string) => {
    const clone = new fabric.Canvas(null, { width: WIDTH, height: HEIGHT })
    await new Promise(res => clone.loadFromJSON(fabricRef.current!.toJSON(), res))
    clone.getObjects().forEach((obj: any) => {
      if (obj.customType === "name") obj.text = name
    })
    const img = clone.toDataURL({ format: "png" })
    const pdf = new jsPDF("landscape", "pt", [WIDTH, HEIGHT])
    pdf.addImage(img, "PNG", 0, 0, WIDTH, HEIGHT)
    return pdf.output("blob")
  }

  const download = (blob: any, filename: string) => {
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
  }

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div className="sidebar">
        <h3>Certificate Editor</h3>

        <label>Font</label>
        <select style={{ width: '100%' }} onChange={e => setFontFamily(e.target.value)}>
          <option value="serif">Serif</option>
          <option value="sans-serif">Sans</option>
          <option value="monospace">Mono</option>
        </select>

        <label>Font Size</label>
        <input type="number" style={{ width: '100%' }} value={fontSize} onChange={e => setFontSize(parseInt(e.target.value))} />

        <label>Color</label>
        <input type="color" value={color} onChange={e => setColor(e.target.value)} />

        <button className="button secondary" onClick={applyStyle}>Apply Style</button>

        <hr />

        <input type="file" onChange={uploadLogo} />
        <input type="file" onChange={uploadSignature} />
        <button className="button secondary" onClick={enableDraw}>Draw Signature</button>
        <button className="button secondary" onClick={disableDraw}>Stop Draw</button>

        <hr />

        <button className="button secondary" onClick={saveLayout}>Save Layout</button>
        <select style={{ width: '100%' }} onChange={e => loadLayout(e.target.value)}>
          <option>Load Layout</option>
          {layouts.map(l => <option key={l}>{l}</option>)}
        </select>

        <textarea style={{ width: '100%', height: 100 }} placeholder="Enter names, one per line" value={names} onChange={e => setNames(e.target.value)} />

        <button className="button primary" onClick={exportCertificates}>Download Certificate(s)</button>
      </div>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#eee' }}>
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}
