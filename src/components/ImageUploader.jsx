import { useRef } from 'react';

const MAX_SIDE = 2400;

async function prepareImage(file) {
    const srcUrl = URL.createObjectURL(file);
    try {
        const img = new Image();
        img.src = srcUrl;
        await img.decode();

        const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
        const width = Math.round(img.naturalWidth * scale);
        const height = Math.round(img.naturalHeight * scale);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);

        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.92));
        return { url: URL.createObjectURL(blob), width, height };
    } finally {
        URL.revokeObjectURL(srcUrl);
    }
}

export function ImageUploader({ hasImage, onImageUpload }) {
    const fileRef = useRef(null);
    const cameraRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        e.target.value = '';
        if (!file) return;

        try {
            const data = await prepareImage(file);
            let detected = 'cuadrada';
            if (data.width > data.height * 1.1) detected = 'horizontal';
            else if (data.height > data.width * 1.1) detected = 'vertical';
            onImageUpload(data, detected);
        } catch (err) {
            console.error(err);
            alert('No se pudo cargar la foto. Prueba con otra.');
        }
    };

    return (
        <div>
            <div className="grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={() => fileRef.current.click()}
                    className="py-3 px-3 rounded-lg text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-black cursor-pointer transition-all"
                >
                    {hasImage ? 'Cambiar foto' : 'Galería'}
                </button>
                <button
                    type="button"
                    onClick={() => cameraRef.current.click()}
                    className="py-3 px-3 rounded-lg text-sm font-semibold bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-amber-500/50 cursor-pointer transition-all"
                >
                    Cámara
                </button>
            </div>

            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
        </div>
    );
}