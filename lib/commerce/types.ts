export type CommerceImage = {
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
};

export type CommerceVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  price: {
    amount: string;
    currencyCode: string;
  };
  compareAtPrice?: {
    amount: string;
    currencyCode: string;
  } | null;
};

export type CommerceProductCard = {
  id: string;
  handle: string;
  title: string;
  featuredImage?: CommerceImage | null;
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  variants: {
    nodes: CommerceVariant[];
  };
};

export type CommerceCategory = {
  id: string;
  handle: string;
  title: string;
  image?: CommerceImage | null;
  products?: {
    nodes: Array<{
      featuredImage?: CommerceImage | null;
    }>;
  };
};

export type CommerceProductDetail = {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  featuredImage?: CommerceImage | null;
  images: {
    nodes: CommerceImage[];
  };
  priceRange: {
    minVariantPrice: {
      amount: string;
      currencyCode: string;
    };
  };
  variants: {
    nodes: CommerceVariant[];
  };
};

export type CommerceCollectionDetail = {
  id: string;
  title: string;
  image?: CommerceImage | null;
  products: {
    nodes: CommerceProductCard[];
    pageInfo?: {
      hasNextPage: boolean;
      totalCount: number;
    };
  };
};

export type PaginatedProducts = {
  products: CommerceProductCard[];
  pageInfo: {
    hasNextPage: boolean;
    totalCount: number;
  };
};

export type HomepageHeroSlide = {
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
};

export type HomepageContent = {
  heroSlides: HomepageHeroSlide[];
  newArrivalsTitle: string;
  categoriesTitle: string;
  stats: Array<{
    label: string;
    value: string;
  }>;
};
