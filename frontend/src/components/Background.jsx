// src/components/Background.jsx

const Background = () => {
  return (
    <div
      // YENİ ANİMASYON CLASS'IMIZI BURAYA EKLİYORUZ
      className="fixed inset-0 -z-10 animate-background-pulse"
      style={{
        backgroundColor: 'rgb(10, 11, 13)',
        backgroundImage: 'radial-gradient(ellipse at top, rgba(228, 228, 229, 0.1), transparent 70%)',
      }}
    />
  );
};

export default Background;