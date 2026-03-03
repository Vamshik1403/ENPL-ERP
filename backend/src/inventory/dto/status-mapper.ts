export const getStatusFromDeliveryType = (deliveryType: string): string => {
    switch (deliveryType) {
      case 'Sale':
        return 'Sold';
      case 'Demo':
        return 'Demo Out';
      case 'Purchase Return':
        return 'Purchase Return';
      default:
        return 'Available';
    }
  };
  