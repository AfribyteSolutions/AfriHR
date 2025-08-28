import React from 'react';

const Preloader = () => {
    return (
        <>
    {/* -- Preloader start -- */}
    <div className="preloader" id="preloader">
        <div className="loading">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
        </div>
    </div>
    {/* -- Preloader start -- */}
        </>
    );
};

export default Preloader;

// import React from "react";

// const Preloader = () => {
//   return (
//     <div
//       id="preloader"
//       className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 dark:from-gray-900 dark:via-orange-900 dark:to-red-900"
//       role="status"
//       aria-label="Loading..."
//     >
//       <div className="relative">
//         {/* Main container with Africa map */}
//         <div className="relative w-32 h-32 mb-8">
//           {/* Outer rotating ring with African colors */}
//           <div className="absolute inset-0 rounded-full border-4 border-transparent bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 animate-spin"></div>
//           <div className="absolute inset-1 rounded-full bg-gradient-to-br from-orange-50 via-yellow-50 to-red-50 dark:from-gray-900 dark:via-orange-900 dark:to-red-900"></div>
          
//           {/* Africa map in the center */}
//           <div className="absolute inset-6 flex items-center justify-center">
//             <svg 
//               viewBox="0 0 100 100" 
//               className="w-full h-full animate-pulse"
//               style={{ animationDuration: '2s' }}
//             >
//               {/* Simplified Africa continent shape */}
//               <path
//                 d="M50 10 C60 10, 70 20, 75 30 C80 40, 85 50, 80 60 C75 70, 70 75, 65 80 C60 85, 55 90, 50 85 C45 80, 40 75, 35 70 C30 65, 25 55, 30 45 C35 35, 40 25, 45 20 C47 15, 48 10, 50 10 Z"
//                 fill="url(#africaGradient)"
//                 className="animate-pulse"
//               />
              
//               {/* Gradient definition */}
//               <defs>
//                 <linearGradient id="africaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
//                   <stop offset="0%" stopColor="#10b981" />
//                   <stop offset="50%" stopColor="#f59e0b" />
//                   <stop offset="100%" stopColor="#ef4444" />
//                 </linearGradient>
//               </defs>
              
//               {/* Animated dots representing major cities */}
//               <circle cx="45" cy="25" r="1.5" fill="#ffffff" className="animate-ping" style={{ animationDelay: '0s' }} />
//               <circle cx="55" cy="35" r="1.5" fill="#ffffff" className="animate-ping" style={{ animationDelay: '0.5s' }} />
//               <circle cx="40" cy="45" r="1.5" fill="#ffffff" className="animate-ping" style={{ animationDelay: '1s' }} />
//               <circle cx="60" cy="55" r="1.5" fill="#ffffff" className="animate-ping" style={{ animationDelay: '1.5s' }} />
//               <circle cx="50" cy="65" r="1.5" fill="#ffffff" className="animate-ping" style={{ animationDelay: '2s' }} />
//             </svg>
//           </div>
          
//           {/* Orbiting computer/tech icons */}
//           <div className="absolute inset-0 rounded-full animate-spin" style={{ animationDuration: '8s' }}>
//             {/* Laptop icon */}
//             <div 
//               className="absolute w-6 h-6 flex items-center justify-center"
//               style={{ 
//                 top: '-12px', 
//                 left: '50%', 
//                 transform: 'translateX(-50%)',
//                 animation: 'counter-spin 8s linear infinite'
//               }}
//             >
//               <svg viewBox="0 0 24 24" className="w-full h-full text-blue-600">
//                 <path fill="currentColor" d="M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6z"/>
//               </svg>
//             </div>
            
//             {/* Smartphone icon */}
//             <div 
//               className="absolute w-6 h-6 flex items-center justify-center"
//               style={{ 
//                 top: '50%', 
//                 right: '-12px', 
//                 transform: 'translateY(-50%)',
//                 animation: 'counter-spin 8s linear infinite'
//               }}
//             >
//               <svg viewBox="0 0 24 24" className="w-full h-full text-green-600">
//                 <path fill="currentColor" d="M17 2H7c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H7V6h10v10z"/>
//               </svg>
//             </div>
            
//             {/* Desktop computer icon */}
//             <div 
//               className="absolute w-6 h-6 flex items-center justify-center"
//               style={{ 
//                 bottom: '-12px', 
//                 left: '50%', 
//                 transform: 'translateX(-50%)',
//                 animation: 'counter-spin 8s linear infinite'
//               }}
//             >
//               <svg viewBox="0 0 24 24" className="w-full h-full text-purple-600">
//                 <path fill="currentColor" d="M21 2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h7l-2 3v1h8v-1l-2-3h7c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 12H3V4h18v10z"/>
//               </svg>
//             </div>
            
//             {/* Tablet icon */}
//             <div 
//               className="absolute w-6 h-6 flex items-center justify-center"
//               style={{ 
//                 top: '50%', 
//                 left: '-12px', 
//                 transform: 'translateY(-50%)',
//                 animation: 'counter-spin 8s linear infinite'
//               }}
//             >
//               <svg viewBox="0 0 24 24" className="w-full h-full text-orange-600">
//                 <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
//               </svg>
//             </div>
            
//             {/* Additional tech icons at diagonal positions */}
//             <div 
//               className="absolute w-5 h-5 flex items-center justify-center"
//               style={{ 
//                 top: '15%', 
//                 right: '15%', 
//                 transform: 'translate(50%, -50%)',
//                 animation: 'counter-spin 8s linear infinite'
//               }}
//             >
//               <svg viewBox="0 0 24 24" className="w-full h-full text-red-600">
//                 <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
//               </svg>
//             </div>
            
//             <div 
//               className="absolute w-5 h-5 flex items-center justify-center"
//               style={{ 
//                 bottom: '15%', 
//                 left: '15%', 
//                 transform: 'translate(-50%, 50%)',
//                 animation: 'counter-spin 8s linear infinite'
//               }}
//             >
//               <svg viewBox="0 0 24 24" className="w-full h-full text-yellow-600">
//                 <path fill="currentColor" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
//               </svg>
//             </div>
//           </div>
//         </div>
        
//         {/* Animated connection lines */}
//         <div className="absolute inset-0 opacity-30">
//           {[...Array(4)].map((_, i) => (
//             <div
//               key={i}
//               className="absolute w-px h-8 bg-gradient-to-t from-transparent via-blue-500 to-transparent animate-pulse"
//               style={{
//                 top: `${25 + i * 15}%`,
//                 left: `${30 + i * 10}%`,
//                 animationDelay: `${i * 0.3}s`,
//                 animationDuration: '2s'
//               }}
//             />
//           ))}
//         </div>
        
//         {/* Data flow animation */}
//         <div className="flex space-x-2 justify-center mb-4">
//           {[...Array(5)].map((_, i) => (
//             <div
//               key={i}
//               className="w-2 h-2 bg-gradient-to-r from-green-500 to-yellow-500 rounded-full animate-bounce"
//               style={{
//                 animationDelay: `${i * 0.15}s`,
//                 animationDuration: '1.5s'
//               }}
//             />
//           ))}
//         </div>
        
//         {/* Loading text */}
//         <div className="text-center">
//           <div className="text-lg font-bold bg-gradient-to-r from-green-600 via-yellow-600 to-red-600 bg-clip-text text-transparent animate-pulse">
//             Connecting Africa
//           </div>
//           <div className="text-sm text-gray-600 dark:text-gray-300 mt-2 animate-fade-in">
//             Powering digital innovation
//           </div>
//         </div>
        
//         {/* Background tech pattern */}
//         <div className="absolute -z-10 inset-0 opacity-10">
//           {[...Array(8)].map((_, i) => (
//             <div
//               key={i}
//               className="absolute w-1 h-1 bg-blue-500 rounded-full animate-ping"
//               style={{
//                 top: `${Math.random() * 100}%`,
//                 left: `${Math.random() * 100}%`,
//                 animationDelay: `${i * 0.4}s`,
//                 animationDuration: '3s'
//               }}
//             />
//           ))}
//         </div>
//       </div>
      
//       <style jsx>{`
//         @keyframes fade-in {
//           from { opacity: 0; transform: translateY(10px); }
//           to { opacity: 1; transform: translateY(0); }
//         }
        
//         @keyframes counter-spin {
//           from { transform: rotate(0deg); }
//           to { transform: rotate(-360deg); }
//         }
        
//         .animate-fade-in {
//           animation: fade-in 2s ease-in-out infinite alternate;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default Preloader;