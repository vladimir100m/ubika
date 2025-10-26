import styles from '../styles/Home.module.css';
import popupStyles from '../styles/PropertyPopup.module.css';
import React, {useState, useRef, RefObject, useCallback, useMemo} from 'react';
// session handling removed from this component (not used)
import { Property, Neighborhood } from '../types';
import { getAllPropertyImagesRaw } from '../lib/propertyImageUtils';
import PropertyImageGrid from './PropertyImageGrid';
import { formatNumberWithCommas } from '../lib/formatPropertyUtils';
import PropertyDetailTabsNav from './PropertyDetailTabsNav';
import PropertyImageCarousel from './PropertyImageCarousel';

export default function PropertyPopup({ 
  selectedProperty, 
  onClose, 
  mapRef
}: { 
  selectedProperty: Property; 
  onClose: () => void; 
  mapRef: RefObject<HTMLDivElement>;
}) {
  // session removed - authentication is handled at higher level if needed
  const [activeTab, setActiveTab] = useState('overview');
  const [descExpanded, setDescExpanded] = useState(false);
  const [neighborhoodData, setNeighborhoodData] = useState<Neighborhood | null>(null);
  const [showCarousel, setShowCarousel] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactFormData, setContactFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: "I'm interested in this property"
  });
  const overviewRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const mapLocationRef = useRef<HTMLDivElement>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleTabChange = useCallback((tabName: string) => {
    setActiveTab(tabName);
    switch(tabName) {
      case 'overview':
        overviewRef.current?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 'details':
        detailsRef.current?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 'map':
        mapLocationRef.current?.scrollIntoView({ behavior: 'smooth' });
        break;
    }
  }, []);
  
  // Memoize image list so we don't recompute on every render
  const allImages = useMemo(() => getAllPropertyImagesRaw(selectedProperty), [selectedProperty]);

  // Handler for gallery navigation
  const handleImageChange = useCallback((direction: 'next' | 'prev') => {
    setImageLoading(true);
    const totalImages = allImages.length || 1;
    setCurrentImageIndex(prev => (direction === 'next' ? (prev + 1) % totalImages : (prev - 1 + totalImages) % totalImages));
  }, [allImages]);

  // formatted price and per square-meter helper values
  const formattedPrice = useMemo(() => formatNumberWithCommas(selectedProperty.price), [selectedProperty.price]);
  const perSqm = useMemo(() => {
    if (!selectedProperty.sq_meters || selectedProperty.sq_meters === 0) return null;
    return Math.round(selectedProperty.price / selectedProperty.sq_meters);
  }, [selectedProperty.price, selectedProperty.sq_meters]);

  // Memoize operation badge so repeated calls in render use same computed value
  const operationBadge = useMemo(() => {
    const operationStatus = selectedProperty.property_status?.display_name;
    const operationStatusId = selectedProperty.property_status?.id;

    const badgeConfig: Record<number, { backgroundColor: string; text: string }> = {
      1: { backgroundColor: '#e4002b', text: operationStatus || 'For Sale' },
      2: { backgroundColor: '#2563eb', text: operationStatus || 'For Rent' },
      3: { backgroundColor: '#6b7280', text: operationStatus || 'Not Available' }
    };

    return badgeConfig[operationStatusId as keyof typeof badgeConfig] || badgeConfig[1];
  }, [selectedProperty.property_status]);

  // Handler for clicking on specific images in the grid
  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setShowCarousel(true);
  };

  // Small data lists memoized for readability
  const statItems = useMemo(() => ([
    { icon: '🛏️', value: selectedProperty.bedrooms, label: 'Bedrooms', color: '#667eea' },
    { icon: '🚿', value: selectedProperty.bathrooms, label: 'Bathrooms', color: '#764ba2' },
    { icon: '📐', value: selectedProperty.sq_meters, label: 'm² Living', color: '#f093fb' },
    { icon: '🏠', value: selectedProperty.property_type?.display_name || 'House', label: 'Property Type', color: '#4facfe', isText: true },
    ...(selectedProperty.year_built ? [{ icon: '🏗️', value: selectedProperty.year_built, label: 'Year Built', color: '#43e97b' }] : []),
    { icon: '🅿️', value: '2', label: 'Parking Spots', color: '#fa709a' }
  ]), [selectedProperty]);

  const infoStats = useMemo(() => ([
    { icon: '🏠', label: 'Type', value: selectedProperty.property_type?.display_name || 'Single Family' },
    { icon: '🏗️', label: 'Built', value: selectedProperty.year_built || '2010' },
    { icon: '📐', label: 'Size', value: `${selectedProperty.sq_meters} m²` },
    { icon: '🆔', label: 'ID', value: `#${selectedProperty.id}` }
  ]), [selectedProperty]);

  const interiorFeatures = useMemo(() => ([
    { icon: '🌳', name: 'Hardwood Floors', description: 'Beautiful oak hardwood throughout' },
    { icon: '🔥', name: 'Fireplace', description: 'Gas fireplace in living room' },
    { icon: '❄️', name: 'Central AC', description: 'Climate controlled comfort' },
    { icon: '💡', name: 'Modern Lighting', description: 'LED fixtures throughout' }
  ]), []);

  const outdoorFeatures = useMemo(() => ([
    { icon: '🏊‍♂️', name: 'Swimming Pool', description: 'Heated saltwater pool with spa', highlight: true },
    { icon: '🌺', name: 'Landscaped Garden', description: 'Professional landscape design', highlight: true },
    { icon: '🚗', name: 'Attached Garage', description: '2-car garage with storage' },
    { icon: '🍖', name: 'BBQ Area', description: 'Built-in outdoor kitchen' },
    { icon: '🌳', name: 'Mature Trees', description: 'Privacy and shade' },
    { icon: '💡', name: 'Outdoor Lighting', description: 'LED landscape lighting' }
  ]), []);

  // Handle contact form actions
  const handleCloseContactForm = () => {
    setShowContactForm(false);
    // Reset form data
    setContactFormData({
      name: '',
      phone: '',
      email: '',
      message: 'I\'m interested in this property'
    });
  };

  const handleContactFormChange = (field: string, value: string) => {
    setContactFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Get dynamic grid layout based on number of images (max 3)
  const gridLayout = useMemo(() => {
    const imageCount = Math.min(allImages.length, 3);
    switch (imageCount) {
      case 1:
        return {
          gridTemplateColumns: '1fr',
          gridTemplateRows: '1fr',
          images: allImages.slice(0, 1),
          showViewAllButton: allImages.length > 1,
        };
      case 2:
        return {
          gridTemplateColumns: '2fr 1fr',
          gridTemplateRows: '1fr',
          images: allImages.slice(0, 2),
          showViewAllButton: allImages.length > 2,
        };
      case 3:
      default:
        return {
          gridTemplateColumns: '2fr 1fr',
          gridTemplateRows: '1fr 1fr',
          images: allImages.slice(0, 3),
          showViewAllButton: allImages.length > 3,
        };
    }
  }, [allImages]);

  // Touch handlers for swipe navigation
  // Touch handlers for swipe navigation
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    if (isLeftSwipe) {
      handleImageChange('next');
    } else if (isRightSwipe) {
      handleImageChange('prev');
    }
  }, [touchStart, touchEnd, handleImageChange]);
  
  return (
    <>
        <div className={styles.propertyDetailOverlay} onClick={onClose}>
          <div className={styles.propertyDetailCard} onClick={(e) => e.stopPropagation()}>
            <div className={popupStyles.topRightButtons}>
              <button
                onClick={(e)=>{e.stopPropagation(); onClose();}}
                aria-label="Close property popup"
                className={popupStyles.iconButton}
              >
                <span className={popupStyles.closeIcon}>×</span>
              </button>
              <button
                onClick={(e)=>{e.stopPropagation();
                  if (navigator.share) {
                    navigator.share({ title: selectedProperty.title || 'Property', text: selectedProperty.description || 'Check this property', url: window.location.href }).catch(()=>{});
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    // small UX feedback; in-app toast would be preferable
                    alert('Link copied');
                  }
                }}
                aria-label="Share property details"
                className={popupStyles.iconButton}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <path d="M8.59 13.51l6.83 3.98" />
                  <path d="M15.41 6.51L8.59 10.49" />
                </svg>
              </button>
            </div>
            
            <div className={`${styles.propertyDetailHeader} ${popupStyles.headerFixedHeight}`}>
              <PropertyImageGrid
                property={selectedProperty}
                onOpenCarousel={(startIndex) => {
                  setCurrentImageIndex(startIndex);
                  setShowCarousel(true);
                }}
              />
            </div>
            <div className={`${styles.propertyDetailContent} ${popupStyles.contentNoPadding}`}>
              <div className={`${styles.propertyDetailBody} ${popupStyles.bodyConstrained}`}>
                {/* Enhanced Property Header - Premium Real Estate Style */}
                <div className={`${styles.propertyDetailInfo} ${styles.propertyHeadBlock}`}>
                  {/* Top Row - Status and Favorites */}
                  <div className={popupStyles.headerRow}>
                    <div className={popupStyles.statusRow}>
                      <span
                        className={popupStyles.statusBadge}
                        style={{
                          ['--op-color' as any]: operationBadge.backgroundColor,
                          ['--op-color-alpha' as any]: `${operationBadge.backgroundColor}dd`
                        }}
                      >{operationBadge.text}</span>

                      {/* New Today Badge */}
                      {/* <span className={popupStyles.hotBadge}>🔥 Hot Listing</span> */}
                    </div>

                    {/* Property Actions */}
                    <div className={popupStyles.actionsGroup}>
                      <button className={popupStyles.actionButtonLight}>📤 Share</button>
                      <button className={popupStyles.actionButtonLight}>❤️ Save</button>
                    </div>
                  </div>

                  {/* Price Section - simplified to show only the main price */}
                  <div className={popupStyles.priceSection}>
                    <div className={popupStyles.priceRow}>
                      <h1 className={popupStyles.priceAmount}>${formattedPrice}</h1>
                    </div>
                  </div>
                  
                  {/* Enhanced Property Stats */}
                  <div className={popupStyles.statsGrid}>
                    {statItems.map((stat, index) => (
                      <div
                        key={index}
                        role="group"
                        aria-label={`${stat.label}: ${stat.value}`}
                        className={`${popupStyles.statCard} ${popupStyles.statTile}`}
                        style={{
                          /* keep color vars for potential theming */
                          ['--stat-bg-start' as any]: `${stat.color}15`,
                          ['--stat-bg-end' as any]: `${stat.color}08`,
                          ['--stat-border' as any]: `${stat.color}20`,
                          ['--stat-shadow' as any]: `${stat.color}20`,
                          ['--stat-border-hover' as any]: `${stat.color}60`,
                          ['--stat-inner' as any]: `${stat.color}10`
                        }}
                      >
                        <div className={popupStyles.statInnerBg} />
                        <div className={popupStyles.statContent}>
                          <span className={popupStyles.statIcon} aria-hidden>{stat.icon}</span>
                          <div className={popupStyles.statText}>
                            <div className={`${popupStyles.statValue} ${stat.isText ? popupStyles.statValueText : ''}`}>{stat.value}</div>
                            <div className={popupStyles.statLabel}>{stat.label}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quick Actions */}
                  <div className={popupStyles.quickActions}>
                    <button className={popupStyles.btnPrimary} onClick={() => setShowContactForm(true)}>📞 Contact Agent</button>
                    <button className={popupStyles.btnSecondary}>📅 Schedule Tour</button>
                    {/* <button className={popupStyles.btnSecondary}>💰 Get Pre-Approved</button> */}
                  </div>
                </div>
                
                {/* What's Special Section - Zillow Style */}
                <div className={popupStyles.highlightsSection}>
                  <h3 className={popupStyles.priceMetaSmall}>✨ Highlights</h3>
                  <div className={popupStyles.highlightGrid}>
                    {selectedProperty.features && selectedProperty.features.length > 0 
                      ? selectedProperty.features.slice(0, 6).map((feature, idx) => (
                          <div key={idx} className={popupStyles.highlightCard}>
                            <span className={popupStyles.highlightIcon}>⭐</span>
                            <span>{feature.name}</span>
                          </div>
                        ))
                      : (
                        <>
                          <div className={popupStyles.highlightCard}><span className={popupStyles.highlightIcon}>⭐</span><span>Prime Location</span></div>
                          <div className={popupStyles.highlightCard}><span className={popupStyles.highlightIcon}>⭐</span><span>Well Maintained</span></div>
                          <div className={popupStyles.highlightCard}><span className={popupStyles.highlightIcon}>⭐</span><span>Modern Updates</span></div>
                        </>
                      )
                    }
                  </div>
                </div>

                {/* Tabs Navigation */}
                <PropertyDetailTabsNav active={activeTab} onChange={handleTabChange} />
                
                {/* All content sections displayed one after another */}
                <div className={popupStyles.whiteBg}>
                  {/* Overview section */}
                  <div ref={overviewRef} id="overview-section" className={styles.overviewSection}>
                    <div className={styles.overviewGrid}>
                      <div className={styles.overviewMain}>
                        <div className={styles.descBlock}>
                          <h3 className={styles.sectionHeading}>About this home</h3>
                          <p className={`${styles.descText} ${!descExpanded ? styles.descClamp : ''}`}>{selectedProperty.description || `This beautiful ${selectedProperty.property_type?.display_name || 'property'} features ${selectedProperty.bedrooms} bedrooms and ${selectedProperty.bathrooms} bathrooms across ${selectedProperty.sq_meters} square meters of living space. Located in a desirable neighborhood in ${selectedProperty.city}, ${selectedProperty.state}, this home offers easy access to local amenities, schools, and transportation.`}</p>
                          {(!descExpanded && (selectedProperty.description?.length || 0) > 320) && (
                            <button className={styles.readMoreBtn} onClick={() => setDescExpanded(true)}>Read more</button>
                          )}
                          {descExpanded && (
                            <button className={styles.readMoreBtn} onClick={() => setDescExpanded(false)}>Show less</button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Facts and Features Section */}
                  <div ref={detailsRef} id="details-section" className={popupStyles.detailsSection}>
                    {/* Section Header */}
                    <div className={popupStyles.detailsHeader}>
                      <h3 className={popupStyles.detailsHeaderTitle}>📊 Property Details</h3>
                      <p className={popupStyles.detailsHeaderSub}>Comprehensive property information at a glance</p>
                      <div className={popupStyles.headerSeparator} />
                    </div>

                    {/* Enhanced Grid Layout */}
                    <div className={popupStyles.gridLayout}>
                      
                      {/* Property Information Card */}
                      <div className={`${popupStyles.infoCard} ${popupStyles.infoCardInner}`}>
                        {/* Card Background Decoration */}
                        <div className={popupStyles.cardDecor} />

                          <div className={popupStyles.cardInner}>
                            <h4 className={popupStyles.cardTitle}>🏢 Property Info</h4>

                          {/* Property Stats Grid */}
                          <div className={popupStyles.infoStatsGrid}>
                            {infoStats.map((item, index) => (
                              <div key={index} className={popupStyles.infoStat}>
                                <div className={popupStyles.infoStatIcon}>{item.icon}</div>
                                <div className={popupStyles.infoStatLabel}>{item.label}</div>
                                <div className={popupStyles.infoStatValue}>{item.value}</div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Interior Features */}
                          <div>
                            <div className={popupStyles.interiorHeading}>🔨 Interior Features</div>
                            
                            <div className={popupStyles.featureList}>
                              {interiorFeatures.map((feature, index) => (
                                    <div key={index} className={popupStyles.featureItem}>
                                      <span className={popupStyles.featureIcon}>{feature.icon}</span>
                                      <div>
                                        <div className={popupStyles.featureName}>{feature.name}</div>
                                        <div className={popupStyles.featureDesc}>{feature.description}</div>
                                      </div>
                                    </div>
                                  ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Outdoor & Amenities Card */}
                      <div className={popupStyles.outdoorCard}>
                        {/* Card Background Decoration */}
                        <div className={popupStyles.cardDecorLeft} />
                        
                        <div className={popupStyles.cardInner}>
                          <h4 className={popupStyles.cardTitle}>🌿 Outdoor & Amenities</h4>
                          
                          {/* Room Stats */}
                          <div className={popupStyles.roomStatsGrid}>
                            {[
                              { icon: '🛏️', label: 'Beds', value: selectedProperty.bedrooms },
                              { icon: '🚿', label: 'Baths', value: selectedProperty.bathrooms },
                              { icon: '🅿️', label: 'Parking', value: '2 cars' }
                            ].map((item, index) => (
                              <div key={index} className={popupStyles.roomStatItem}>
                                <div className={popupStyles.roomStatIcon}>{item.icon}</div>
                                <div className={popupStyles.roomStatValue}>{item.value}</div>
                                <div className={popupStyles.roomStatLabel}>{item.label}</div>
                              </div>
                            ))}
                          </div>
                          
                          {/* Outdoor Features */}
                          <div>
                            <div className={popupStyles.outdoorHeading}>🌟 Outdoor Features</div>
                            
                            <div className={popupStyles.outdoorFeatureList}>
                              {outdoorFeatures.map((feature, index) => (
                                <div key={index} className={`${popupStyles.outdoorItem} ${feature.highlight ? popupStyles.outdoorHighlight : ''}`}>
                                      {feature.highlight && <div className={popupStyles.featureBadge}>Featured</div>}
                                      <span className={popupStyles.outdoorIcon}>{feature.icon}</span>
                                      <div className={popupStyles.outdoorItemContent}>
                                        <div className={popupStyles.outdoorItemTitle}>{feature.name}</div>
                                        <div className={popupStyles.outdoorItemDesc}>{feature.description}</div>
                                      </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Additional Info Banner */}
                    <div className={popupStyles.additionalBanner}>
                      <div className={popupStyles.bannerIcon}>🏆</div>
                      <h5 className={popupStyles.bannerTitle}>Premium Property Features</h5>
                      <p className={popupStyles.bannerText}>This property includes high-end finishes, energy-efficient systems, and smart home integration</p>
                    </div>
                  </div>
                  
                  {/* Location Section */}
                    <div ref={mapLocationRef} id="location-section" className={popupStyles.locationSection}>
                    <div>
                      <h2 className={popupStyles.sectionTitle}>Location</h2>
                      
                      {/* Map Subsection */}
                      <div className={popupStyles.subsectionBlock}>
                        <h3 className={popupStyles.subsectionTitle}>Map</h3>
                        <div className={popupStyles.mapBox}>
                          <div ref={mapRef} className={popupStyles.mapInner}></div>
                        </div>
                      </div>
                      
                      {/* Neighborhood Subsection */}
                      <div>
                        <h3 className={popupStyles.subsectionTitle}>Neighborhood</h3>
                        <p className={popupStyles.neighborhoodParagraph}>
                          This property is located in {selectedProperty.city}, {selectedProperty.state} {selectedProperty.zip_code}, a desirable neighborhood with easy access to schools, shopping, and public transportation.
                        </p>
                      
                      <div className={popupStyles.neighborhoodGrid}>
                        <div className={popupStyles.neighborhoodCard}>
                          <h4 className={popupStyles.cardHeading}>Transportation</h4>
                          
                          <div className={popupStyles.iconRow}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={popupStyles.iconSvg}>
                              <path d="M8 5H16C17.1046 5 18 5.89543 18 7V19C18 20.1046 17.1046 21 16 21H8C6.89543 21 6 20.1046 6 19V7C6 5.89543 6.89543 5 8 5Z" stroke="#1277e1" strokeWidth="2" />
                              <path d="M6 9H18" stroke="#1277e1" strokeWidth="2" />
                              <path d="M9 17H15" stroke="#1277e1" strokeWidth="2" />
                            </svg>
                            <div>
                              <div className={popupStyles.smallHeading}>Public Transportation</div>
                              <div className={popupStyles.smallText}>
                                {neighborhoodData?.subway_access || '10 minute walk to nearest subway station'}
                              </div>
                            </div>
                          </div>
                          
                          <div className={popupStyles.iconRowNoMargin}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={popupStyles.iconSvg}>
                              <path d="M5 5H19C20.1046 5 21 5.89543 21 7V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V7C3 5.89543 3.89543 5 5 5Z" stroke="#1277e1" strokeWidth="2" />
                              <path d="M3 9H21" stroke="#1277e1" strokeWidth="2" />
                              <path d="M7 15H8" stroke="#1277e1" strokeWidth="2" strokeLinecap="round" />
                              <path d="M12 15H13" stroke="#1277e1" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <div>
                              <div className={popupStyles.smallHeading}>Highway Access</div>
                              <div className={popupStyles.smallText}>
                                {neighborhoodData?.highway_access || '5 minute drive to nearest highway'}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className={popupStyles.neighborhoodCard}>
                          <h4 className={popupStyles.cardHeading}>Restaurants & Shopping</h4>
                          
                          <div className={popupStyles.iconRow}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={popupStyles.iconSvg}>
                              <path d="M14 3H10C9.44772 3 9 3.44772 9 4V11H15V4C15 3.44772 14.5523 3 14 3Z" stroke="#1277e1" strokeWidth="2" />
                              <path d="M9 7H6C5.44772 7 5 7.44772 5 8V11H9V7Z" stroke="#1277e1" strokeWidth="2" />
                              <path d="M15 7H18C18.5523 7 19 7.44772 19 8V11H15V7Z" stroke="#1277e1" strokeWidth="2" />
                              <path d="M5 11H19V16C19 18.2091 17.2091 20 15 20H9C6.79086 20 5 18.2091 5 16V11Z" stroke="#1277e1" strokeWidth="2" />
                            </svg>
                            <div>
                              <div className={popupStyles.smallHeading}>Restaurants</div>
                              <div className={popupStyles.smallText}>
                                {neighborhoodData?.dining_options || 'Variety of dining options within walking distance'}
                              </div>
                            </div>
                          </div>
                          
                          <div className={popupStyles.iconRowNoMargin}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={popupStyles.iconSvg}>
                              <path d="M16 6V4C16 2.89543 15.1046 2 14 2H10C8.89543 2 8 2.89543 8 4V6M3 6H21V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6Z" stroke="#1277e1" strokeWidth="2" />
                            </svg>
                            <div>
                              <div className={popupStyles.smallHeading}>Shopping</div>
                              <div className={popupStyles.smallText}>
                                {neighborhoodData?.shopping_access || 'Shopping centers and grocery stores nearby'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Agent Section */}
                <div className={popupStyles.contactSection}>
                    <div className={popupStyles.contactInner}>
                      {!showContactForm ? (
                        // Initial state - just show the contact button
                        <div className={`${popupStyles.contactIntro} ${showContactForm ? popupStyles.hidden : ''}`}>
                          <h3>Contact an agent about this home</h3>
                          <p>Get more information about this property, schedule a viewing, or ask any questions you may have.</p>
                          <button 
                            onClick={() => setShowContactForm(true)}
                            className={popupStyles.contactPrimaryBtn}
                          >
                            Contact Agent
                          </button>
                        </div>
                      ) : (
                        // Contact form state
                        <div className={`${popupStyles.contactCard} ${showContactForm ? '' : popupStyles.hidden}`}>
                          <div className={popupStyles.contactHeader}>
                            <h3>Contact an agent</h3>
                            <button
                              onClick={handleCloseContactForm}
                              className={popupStyles.contactCloseBtn}
                              aria-label="Close contact form"
                            >
                              ×
                            </button>
                          </div>

                          <div className={popupStyles.contactFieldsGrid}>
                            <div>
                              <input 
                                className={popupStyles.inputField}
                                type="text" 
                                placeholder="Your Name" 
                                value={contactFormData.name}
                                onChange={(e) => handleContactFormChange('name', e.target.value)}
                              />
                            </div>
                            <div>
                              <input 
                                className={popupStyles.inputField}
                                type="text" 
                                placeholder="Phone" 
                                value={contactFormData.phone}
                                onChange={(e) => handleContactFormChange('phone', e.target.value)}
                              />
                            </div>
                          </div>

                          <div className={popupStyles.contactFieldSingle}>
                            <input 
                              className={popupStyles.inputField}
                              type="email" 
                              placeholder="Email" 
                              value={contactFormData.email}
                              onChange={(e) => handleContactFormChange('email', e.target.value)}
                            />
                            <textarea 
                              className={popupStyles.textareaField}
                              rows={4} 
                              placeholder="I'm interested in this property" 
                              value={contactFormData.message}
                              onChange={(e) => handleContactFormChange('message', e.target.value)}
                            />
                          </div>

                          <div className={popupStyles.formActions}>
                            <button 
                              onClick={handleCloseContactForm}
                              className={popupStyles.btnCancel}
                            >
                              Cancel
                            </button>
                            <button 
                              className={popupStyles.btnSend}
                            >
                              Send Message
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <PropertyImageCarousel
          property={selectedProperty}
          isOpen={showCarousel}
          currentIndex={currentImageIndex}
          onRequestClose={() => setShowCarousel(false)}
          onNavigate={handleImageChange}
          onSelectIndex={(i) => setCurrentImageIndex(i)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          imageLoading={imageLoading}
          setImageLoading={setImageLoading}
        />
    </>
  );
}
