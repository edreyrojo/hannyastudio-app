import { useState, useRef } from 'react';

export function ImageUploader({ onImageUpload }) {
    const fileRef = useRef(null);
    const cameraRef = useRef(null);

    const [tempImage, setTempImage] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [offsetX, setOffsetX] = useState(0);
    const [offsetY, setOffsetY] = useState(0);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const imageUrl = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            const { width, height } = img;
            let detected = 'cuadrada';
            if (width > height * 1.1) detected = 'horizontal';
            else if (height > width * 1.1) detected = 'vertical';
            
            // Guardamos temporalmente para permitir el ajuste de encuadre
            setTempImage({ url: imageUrl, template: detected });
            setZoom(1);
            setOffsetX(0);
            setOffsetY(0);
        };
        img.src = imageUrl;
        e.target.value = '';
    };

    const handleConfirmCrop = () => {
        if (!tempImage) return;
        // Enviamos la imagen junto con los parámetros de ajuste al componente principal
        onImageUpload(tempImage.url, tempImage.template, { zoom, offsetX, offsetY });
        setTempImage(null);
    };

    return (
        <div className="w-full bg-zinc-900 p-4 rounded-xl shadow-md border border-amber-500/30 mb-4">
            <label className="block text-sm font-medium text-amber-200/80 mb-2">
                1. Sube o toma la foto del entrenamiento:
            </label>

            {!tempImage ? (
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => fileRef.current.click()}
                        className="py-2 px-3 rounded-lg text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-black cursor-pointer transition-all"
                    >
                        Galeria
                    </button>
                    <button
                        type="button"
                        onClick={() => cameraRef.current.click()}
                        className="py-2 px-3 rounded-lg text-sm font-semibold bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-amber-500/50 cursor-pointer transition-all"
                    >
                        Camara
                    </button>
                </div>
            ) : (
                <div className="flex flex-col space-y-3 bg-black p-3 rounded-lg border border-amber-500/50">
                    <span className="text-xs text-amber-400 font-semibold text-center">
                        Ajusta el encuadre de la foto grupal:
                    </span>
                    
                    {/* Previsualizador interactivo del ajuste */}
                    <div className="relative w-full h-48 bg-zinc-950 overflow-hidden rounded border border-zinc-700 flex items-center justify-center">
                        <img 
                            src={tempImage.url} 
                            alt="Ajuste" 
                            className="absolute object-cover transition-transform duration-75"
                            style={{
                                transform: `scale(${zoom}) translate(${offsetX}px, ${offsetY}px)`,
                                maxWidth: '100%',
                                maxHeight: '100%'
                            }}
                        />
                    </div>

                    {/* Controles deslizantes para Zoom y Desplazamiento */}
                    <div className="space-y-2 text-xs text-amber-200/80">
                        <div className="flex justify-between items-center">
                            <span>Zoom: {zoom.toFixed(1)}x</span>
                            <input 
                                type="range" 
                                min="1" 
                                max="2.5" 
                                step="0.1" 
                                value={zoom} 
                                onChange={(e) => setZoom(parseFloat(e.target.value))}
                                className="w-2/3 accent-amber-500 cursor-pointer"
                            />
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Vertical: {offsetY}px</span>
                            <input 
                                type="range" 
                                min="-100" 
                                max="100" 
                                value={offsetY} 
                                onChange={(e) => setOffsetY(parseInt(e.target.value))}
                                className="w-2/3 accent-amber-500 cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="flex space-x-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setTempImage(null)}
                            className="w-1/2 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-200 text-xs font-semibold cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirmCrop}
                            className="w-1/2 py-2 rounded bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold cursor-pointer"
                        >
                            Aplicar Encuadre
                        </button>
                    </div>
                </div>
            )}

            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
        </div>
    );
}