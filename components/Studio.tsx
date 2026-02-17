
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
  const [backgrounds, setBackgrounds] = useState<string[]>([])

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
    addText("CERTIFICATE", WIDTH / 2, 180, 80, true, 'Cinzel', '#8B6B2E', 1000)
    addText("OF ACHIEVEMENT", WIDTH / 2, 250, 32, false, 'Cinzel', '#8B6B2E', 800)

    addText("Kalsubai Trek - Highest Peak of Maharashtra", WIDTH / 2, 320, 24, true, 'Montserrat', '#1D1D1B', 1000)
    addText("This Certificate Is Proudly Presented To", WIDTH / 2, 365, 18, false, 'Montserrat', '#555', 800)

    const nameField = new fabric.Textbox("MILIND GAUDE", {
      left: WIDTH / 2,
      top: 415,
      width: 1000,
      fontSize: 64,
      textAlign: 'center',
      originX: 'center',
      fill: '#8B6B2E',
      fontWeight: 'bold',
      fontFamily: 'Cinzel'
    })
    nameField.set('customType', 'name')
    canvas.add(nameField)

    const description = "This certificate is awarded for successfully completing the Kalsubai trek. One of the most challenging treks in Maharashtra, and we commend you for your determination and perseverance. We hope this certificate serves as a reminder of your incredible achievement and inspires you to continue exploring the great outdoors. Congrats!"

    const descText = new fabric.Textbox(description, {
      left: WIDTH / 2,
      top: 510,
      width: 1000,
      fontSize: 20,
      textAlign: 'center',
      originX: 'center',
      fill: '#1D1D1B',
      fontFamily: 'Lora',
      lineHeight: 1.2
    })
    canvas.add(descText)

    // Footer sections (Date and Signature)
    const footerY = 800
    const footerOffset = 300

    // Date
    addText("21/08/2025", WIDTH / 2 - footerOffset, footerY, 28, true, 'Montserrat', '#1D1D1B', 300)
    const dateLine = new fabric.Line([WIDTH / 2 - footerOffset - 120, footerY + 40, WIDTH / 2 - footerOffset + 120, footerY + 40], {
      stroke: '#1D1D1B',
      strokeWidth: 1,
      selectable: false
    })
    canvas.add(dateLine)
    addText("DATE", WIDTH / 2 - footerOffset, footerY + 50, 18, true, 'Montserrat', '#1D1D1B', 200)

    // Signature
    addText("Milind Gaude", WIDTH / 2 + footerOffset, footerY - 10, 36, false, 'Alex Brush', '#1D1D1B', 300)
    const sigLine = new fabric.Line([WIDTH / 2 + footerOffset - 120, footerY + 40, WIDTH / 2 + footerOffset + 120, footerY + 40], {
      stroke: '#1D1D1B',
      strokeWidth: 1,
      selectable: false
    })
    canvas.add(sigLine)
    addText("Head Operations", WIDTH / 2 + footerOffset, footerY + 50, 18, true, 'Montserrat', '#1D1D1B', 300)

    loadLayouts()
    fetchBackgrounds()
  }, [])

  const fetchBackgrounds = async () => {
    try {
      const res = await fetch('/api/list-bgs')
      const data = await res.json()
      if (data.backgrounds) {
        setBackgrounds(data.backgrounds)
      }
    } catch (error) {
      console.error('Failed to fetch backgrounds:', error)
    }
  }

  const changeBackground = (url: string) => {
    if (!fabricRef.current) return
    fabric.Image.fromURL(url, img => {
      img.scaleToWidth(WIDTH)
      img.scaleToHeight(HEIGHT)
      img.selectable = false
      img.evented = false
      fabricRef.current?.setBackgroundImage(img, fabricRef.current.renderAll.bind(fabricRef.current))
    })
  }

  const uploadBackground = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload-bg', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      if (data.success) {
        fetchBackgrounds()
        changeBackground(data.url)
      } else {
        alert(data.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed')
    }
  }

  const addText = (text: string, x: number, y: number, size: number, bold: boolean, family = 'serif', color = '#000', width = 800) => {
    const t = new fabric.Textbox(text, {
      left: x,
      top: y,
      width: width,
      fontSize: size,
      fill: color,
      textAlign: 'center',
      originX: 'center',
      fontFamily: family,
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
    localStorage.setItem("layout_" + name, JSON.stringify(fabricRef.current.toJSON(['customType'])))
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
    return new Promise<Blob>((resolve) => {
      const clone = new fabric.Canvas(null, { width: WIDTH, height: HEIGHT })
      clone.loadFromJSON(fabricRef.current!.toJSON(['customType']), () => {
        clone.getObjects().forEach((obj: any) => {
          if (obj.customType === "name") {
            obj.set({ text: name })
          }
        })
        clone.renderAll()
        const img = clone.toDataURL({ format: "png", multiplier: 2 })
        const pdf = new jsPDF("landscape", "pt", [WIDTH, HEIGHT])
        pdf.addImage(img, "PNG", 0, 0, WIDTH, HEIGHT)
        resolve(pdf.output("blob"))
      })
    })
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
        <label>Backgrounds</label>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '10px',
          maxHeight: '200px',
          overflowY: 'auto',
          padding: '10px',
          border: '1px solid #ddd',
          borderRadius: '4px'
        }}>
          {backgrounds.map(bg => (
            <div
              key={bg}
              onClick={() => changeBackground(bg)}
              style={{
                cursor: 'pointer',
                border: '2px solid transparent',
                borderRadius: '4px',
                overflow: 'hidden'
              }}
            >
              <img src={bg} alt="Background" style={{ width: '100%', display: 'block' }} />
            </div>
          ))}
        </div>
        <input type="file" onChange={uploadBackground} style={{ marginTop: '10px' }} />
        <p style={{ fontSize: '12px', color: '#666' }}>Upload new background</p>

        <hr />

        <label>Logos & Signatures</label>
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
