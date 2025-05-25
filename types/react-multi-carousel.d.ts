declare module 'react-multi-carousel' {
  import { ComponentType } from 'react';

  export interface ResponsiveType {
    [key: string]: {
      breakpoint: { max: number; min: number };
      items: number;
    };
  }

  export interface CarouselProps {
    responsive: ResponsiveType;
    children: React.ReactNode;
    infinite?: boolean;
    autoPlay?: boolean;
    autoPlaySpeed?: number;
    keyBoardControl?: boolean;
    customTransition?: string;
    transitionDuration?: number;
    containerClass?: string;
    removeArrowOnDeviceType?: string[];
    showDots?: boolean;
    dotListClass?: string;
    itemClass?: string;
    sliderClass?: string;
    renderButtonGroupOutside?: boolean;
    renderDotsOutside?: boolean;
  }

  const Carousel: ComponentType<CarouselProps>;

  export default Carousel;
}
