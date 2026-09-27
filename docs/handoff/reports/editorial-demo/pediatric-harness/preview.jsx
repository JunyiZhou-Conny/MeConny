
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../sources/Airway-Management-Assistant/src/index.css';
import AuthenticatedApp from '../sources/Airway-Management-Assistant/src/components/AuthenticatedApp.js';
import '../sources/Airway-Management-Assistant/src/styles.css';
function Preview() {
  const [activeInterface, setActiveInterface] = useState('ChatbotUi');
  return <AuthenticatedApp
    user={{picture: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='}}
    isUserAdmin={true} chatbotLoaded={true} participantID=""
    activeInterface={activeInterface} setActiveInterface={setActiveInterface}
    showParticipantIDPopup={false} setShowParticipantIDPopup={()=>{}}
    isProfileModalVisible={false} setIsProfileModalVisible={()=>{}}
    setParticipantID={()=>{}} setChatbotLoaded={()=>{}} />;
}
createRoot(document.getElementById('root')).render(<Preview />);
