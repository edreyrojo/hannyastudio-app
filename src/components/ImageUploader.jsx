import { useRef } from 'react';

export function ImageUploader({ onImageUpload }) {
    const fileRef = useRef(null);
    const cameraRef = useRef(null);

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
            onImageUpload(imageUrl, detected);
        };
        img.src = imageUrl;
        e.target.value = ''; // permite elegir la misma foto otra vez
    };

    return (
        <div className="w-full bg-black-800 p-4 rounded-xl shadow-md border border-amber-700 mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
                1. Sube o toma la foto del entrenamiento:
            </label>

            <div className="grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={() => fileRef.current.click()}
                    className="py-2 px-3 rounded-lg text-sm font-semibold bg-amber-500 hover:bg-amber-500 text-white cursor-pointer"
                >
                    📁 Galería
                </button>
                <button
                    type="button"
                    onClick={() => cameraRef.current.click()}
                    className="py-2 px-3 rounded-lg text-sm font-semibold bg-amber-700 hover:bg-amber-600 text-white cursor-pointer"
                >
                    📷 Foto
                </button>
            </div>

            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
        </div>
    );
}