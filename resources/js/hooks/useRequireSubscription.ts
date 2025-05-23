import { useState, useCallback } from 'react';
import axios from 'axios';

export function useRequireSubscription() {
    const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

    const requireSubscription = useCallback(async () => {
        try {
            const response = await axios.post('/api/check-subscription');
            const hasActiveSubscription = response.data.hasActiveSubscription;
            
            if (!hasActiveSubscription) {
                setUpgradeModalOpen(true);
                return false;
            }
            return true;
        } catch (error) {
            console.error('Failed to check subscription status:', error);
            setUpgradeModalOpen(true);
            return false;
        }
    }, []);

    return { requireSubscription, upgradeModalOpen, setUpgradeModalOpen };
}