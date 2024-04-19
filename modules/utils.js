// import fixText from "./fixtext";
const fixText = require("./fixtext");

function extractPrice(all_product, i) {
  // Find the index of the `<span class="a-price"` element
  const priceSpanIndex = all_product[i].indexOf('<span class="a-price"');

  if (priceSpanIndex === -1) {
    return null; // Price span not found
  }

  // Find the index of the `<span class="a-offscreen">` element
  const offScreenSpanIndex = all_product[i].indexOf(
    '<span class="a-offscreen">',
    priceSpanIndex
  );

  if (offScreenSpanIndex === -1) {
    return null; // Offscreen span not found
  }

  // Find the closing `</span>` tag for the offscreen span
  const spanCloseIndex = all_product[i].indexOf("</span>", offScreenSpanIndex);

  if (spanCloseIndex === -1) {
    return null; // Closing span tag not found
  }

  // Extract the content between the `<span class="a-offscreen">` and `</span>`
  const priceWithSymbol = all_product[i].substring(
    offScreenSpanIndex + '<span class="a-offscreen">'.length,
    spanCloseIndex
  );

  // Use a regular expression to extract only the numerical part of the price
  const priceMatch = priceWithSymbol.match(/[0-9,.]+/);

  return priceMatch ? Number(priceMatch[0].replace(/,/g, "")) : null;
}

function extractProductName(html) {
  let startTokens = [
    '<span class="a-size-medium a-color-base a-text-normal">',
    '<span class="a-size-base-plus a-color-base a-text-normal">',
  ];
  const endToken = "</span>";

  for (let i = 0; i < startTokens.length; i++) {
    const startIndex = html.indexOf(startTokens[i]);
    if (startIndex !== -1) {
      const endIndex = html.indexOf(
        endToken,
        startIndex + startTokens[i].length
      );
      if (endIndex !== -1) {
        // Assuming fixText is a function you have defined to clean up the text
        return fixText(
          html.substring(startIndex + startTokens[i].length, endIndex)
        );
      }
    }
  }

  return null; // Return null if neither token is found
}

// Function to extract the image URL and replace part of it
function extractImageUrl(html) {
  const startToken = 'src="';
  const endToken = '"';
  const startIndex = html.indexOf(startToken);
  const endIndex = html.indexOf(endToken, startIndex + startToken.length);
  return startIndex !== -1 && endIndex !== -1
    ? html
        .substring(startIndex + startToken.length, endIndex)
        .replace("_AC_UY218_.jpg", "_SL1000_.jpg")
    : null;
}

// Function to extract the original price
function extractOriginalPrice(html) {
  const startToken =
    '<span class="a-price a-text-price" data-a-size="b" data-a-strike="true" data-a-color="secondary"><span class="a-offscreen">';
  const endToken = "</span>";
  const startIndex = html.indexOf(startToken);
  const endIndex = html.indexOf(endToken, startIndex + startToken.length);
  return startIndex !== -1 && endIndex !== -1
    ? parseFloat(
        html
          .substring(startIndex + startToken.length, endIndex)
          .replace(/,/g, "")
          .replace("₹", "")
          .trim()
      )
    : null;
}

// Main Product Information.
function get_about_this_product(html) {
  // Attempt to extract the features list section
  const featureSection = html
    .split('<ul class="a-unordered-list a-vertical a-spacing-mini">')[1]
    .split("</ul>")[0];

  if (!featureSection) return [null]; // Early return if the section is not found

  // Split the section into individual features and map over them
  return (
    featureSection
      .split('<span class="a-list-item">')
      .slice(1) // Skip the first element as it's before the first feature
      .map((feat) => fixText(feat.split("</span>")[0]))
      .filter(Boolean) || [null] // Filter out any falsy values from the results
  ); // Provide a default value in case the entire operation results in falsy
}

function get_image_from_product(html) {
  // Attempt to extract the image URL from the 'data-old-hires' attribute
  let image = html
    .split('<div id="imgTagWrapperId" class="imgTagWrapper"')[1]
    .split('data-old-hires="')[1]
    .split('"')[0]
    .replaceAll("\n", "")
    .trim();

  // If the 'data-old-hires' attribute does not provide a URL, try 'data-a-dynamic-image'
  if (!image) {
    const dynamicImageJson = html
      .split('<div id="imgTagWrapperId" class="imgTagWrapper">')[1]
      .split('data-a-dynamic-image="')[1]
      .split('"')[0]
      .replaceAll("&quot;", '"');

    if (dynamicImageJson) {
      try {
        const dynamicImageUrls = JSON.parse(`{${dynamicImageJson}}`);
        // Assuming we want the first image URL from the dynamic image object
        image = Object.keys(dynamicImageUrls)[0];
      } catch (e) {
        console.error("Error parsing dynamic image JSON:", e);
        // Handle JSON parsing error or set a default/fallback image URL if necessary
      }
    }
  }

  // Return the found image URL or null if none is found
  return image || null;
}

function get_review_from_product(html) {
  // Helper function to get the last entry from a split operation
  const lastEntry = (array) => array[array.length - 1];

  try {
    // Extract the review section. If not present, this method will return early.
    const reviewSection = html.split("ratings</span>")[0];
    if (!reviewSection) {
      console.error("Review section not found");
      return null;
    }

    // Extract the ratings count
    const ratingsCountString = lastEntry(reviewSection.split(">"))
      .replace(/,/g, "")
      .trim();
    const ratings_count = parseInt(ratingsCountString, 10); // Ensure base 10

    // Extract the rating value
    const ratingString = lastEntry(
      lastEntry(reviewSection.split("a-icon-star"))
        .split("</span>")[0]
        .split("out of")[0]
        .split(">")
    ).trim();
    const rating = parseFloat(ratingString);

    // Validate extracted values to ensure they are not NaN
    if (isNaN(ratings_count) || isNaN(rating)) {
      console.error("Ratings count or rating could not be parsed");
      return null;
    }

    return { ratings_count, rating };
  } catch (error) {
    console.error("Error extracting review details:", error);
    return null;
  }
}

function get_stock_info_from_product(html) {
  let inStock = false;
  let message = "Out of stock";

  try {
    // Use a regular expression to match the availability information
    const stockRegex =
      /id="availability"[^>]*>\s*<span[^>]*>\s*(In stock)\s*<\/span>/i;
    const matches = html.match(stockRegex);

    if (matches && matches[1].toLowerCase() === "in stock") {
      inStock = true;
      message = "In stock";
    }
  } catch (error) {
    console.error("Error extracting stock information:", error);
  }

  return { in_stock: inStock, message };
}

function get_prices_from_product(html) {
  let price = null;
  let original_price = null;

  // Helper function to clean and parse price
  const parsePrice = (priceString) => {
    // Remove currency symbol and commas, then trim whitespace
    const cleanedPrice = priceString.replace(/[₹,]/g, "").trim();
    // Parse the cleaned price string as a float
    return parseFloat(cleanedPrice);
  };

  // Extract the current price using its class name
  try {
    const currentPriceClass = "a-price-whole";
    const currentPriceSplit = html.split(`<span class="${currentPriceClass}">`);
    if (currentPriceSplit.length >= 2) {
      price = parsePrice(currentPriceSplit[1].split("</span>")[0]);
    }
  } catch (error) {
    console.error("Error extracting the current price:", error);
  }

  // Extract the original price using the provided working code
  try {
    const originalPriceDiv = html.split(
      /<span class="a-price a-text-price" data-a-size="s" data-a-strike="true" data-a-color="secondary">/g
    );

    if (originalPriceDiv.length >= 2) {
      original_price = parsePrice(
        originalPriceDiv[1]
          .split('<span class="a-offscreen">')[1]
          .split("</span>")[0]
      );
    }
  } catch (error) {
    console.error("Error extracting the original price:", error);
  }

  return { price, original_price }; // Return both prices, with nulls for any that couldn't be extracted
}

module.exports = {
  extractImageUrl,
  extractOriginalPrice,
  extractPrice,
  extractProductName,
  get_about_this_product,
  get_image_from_product,
  get_review_from_product,
  get_stock_info_from_product,
  get_prices_from_product,
};
