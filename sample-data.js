// Sample data for MongoDB collections
// Note: This is just example data, not for direct import

// --- Predictable ObjectIDs for Testing ---
const user1Id = "61f0a9b7d6b3c2a4c8f0a1b1";
const user2Id = "61f0a9b7d6b3c2a4c8f0a1b2";
const user3Id = "61f0a9b7d6b3c2a4c8f0a1b3";

const product1Id = "61f0a9b7d6b3c2a4c8f0b1c1"; // Áo Thun Cotton
const product2Id = "61f0a9b7d6b3c2a4c8f0b1c2"; // Quần Jeans Slim Fit
const product3Id = "61f0a9b7d6b3c2a4c8f0b1c3"; // Áo Sơ Mi Oxford
const product4Id = "61f0a9b7d6b3c2a4c8f0b1c4"; // Quần Kaki Chinos
const product5Id = "61f0a9b7d6b3c2a4c8f0b1c5"; // Áo Khoác Bomber
const product6Id = "61f0a9b7d6b3c2a4c8f0b1c6"; // Váy Hoa Maxi
const product7Id = "61f0a9b7d6b3c2a4c8f0b1c7"; // Áo Hoodie Nỉ Bông
const product8Id = "61f0a9b7d6b3c2a4c8f0b1c8"; // Quần Short Jean Nữ

const cart1Id = "61f0a9b7d6b3c2a4c8f0c1d1";
const cart2Id = "61f0a9b7d6b3c2a4c8f0c1d2";
// ----------------------------------------

// User Collection Sample Data
const users = [
  {
    _id: user1Id,
    username: "johndoe",
    email: "john@example.com",
    password: "$2a$10$dWfA4rRVzYHMHHpJ8rKSK.wMIcI7XEs5Mku0sEv7uKCQkqtLVvXWS", // Plain text: "password123"
    createdAt: new Date("2023-06-10T10:00:00Z"),
    updatedAt: new Date("2023-06-10T10:00:00Z"),
  },
  {
    _id: user2Id,
    username: "janedoe",
    email: "jane@example.com",
    password: "$2a$10$dWfA4rRVzYHMHHpJ8rKSK.wMIcI7XEs5Mku0sEv7uKCQkqtLVvXWS", // Plain text: "password123"
    createdAt: new Date("2023-06-12T14:30:00Z"),
    updatedAt: new Date("2023-06-12T14:30:00Z"),
  },
  {
    _id: user3Id,
    username: "mikesmith",
    email: "mike@example.com",
    password: "$2a$10$dWfA4rRVzYHMHHpJ8rKSK.wMIcI7XEs5Mku0sEv7uKCQkqtLVvXWS", // Plain text: "password123"
    createdAt: new Date("2023-06-15T09:45:00Z"),
    updatedAt: new Date("2023-06-15T09:45:00Z"),
  },
];

// Product Collection Sample Data (Clothing)
const products = [
  {
    _id: product1Id,
    name: "Áo Thun Cotton Cơ Bản",
    description:
      "Áo thun nam/nữ cổ tròn, chất liệu 100% cotton thoáng mát, thấm hút mồ hôi tốt. Phom dáng regular fit thoải mái, dễ phối đồ.",
    price: 150000, // 150,000 VND
    image:
      "https://bizweb.dktcdn.net/thumb/grande/100/460/639/products/2-ef1d4a13-915a-4e1a-851e-87727b4c4e76.png?v=1679988393813",
    type: "Áo Thun",
    inStock: true,
    createdAt: new Date("2023-01-15T08:30:00Z"),
    updatedAt: new Date("2023-01-15T08:30:00Z"),
  },
  {
    _id: product2Id,
    name: "Quần Jeans Nam Slim Fit",
    description:
      "Quần jeans nam ống côn, dáng ôm vừa vặn (slim fit). Chất liệu denim co giãn nhẹ, mang lại cảm giác thoải mái khi vận động. Màu xanh wash cơ bản.",
    price: 450000, // 450,000 VND
    image:
      "https://sakurafashion.vn/upload/sanpham/large/491792-quan-jean-ong-rong-nu-theu-hoa-hoa-tiet-denim-1.jpg",
    type: "Quần Jeans",
    inStock: true,
    createdAt: new Date("2023-02-10T10:15:00Z"),
    updatedAt: new Date("2023-02-10T10:15:00Z"),
  },
  {
    _id: product3Id,
    name: "Áo Sơ Mi Nam Oxford",
    description:
      "Áo sơ mi nam dài tay, chất liệu vải Oxford cao cấp, dày dặn và đứng phom. Thiết kế cổ cài nút (button-down) lịch sự, phù hợp đi làm hoặc đi chơi.",
    price: 350000, // 350,000 VND
    image:
      "https://xstore.b-cdn.net/elementor2/marseille04/wp-content/uploads/sites/2/2022/12/Image-16.2-min.jpg",
    type: "Áo Sơ Mi",
    inStock: true,
    createdAt: new Date("2023-02-20T09:00:00Z"),
    updatedAt: new Date("2023-02-20T09:00:00Z"),
  },
  {
    _id: product4Id,
    name: "Quần Kaki Nam Chinos",
    description:
      "Quần kaki nam ống đứng, phom dáng chinos hiện đại. Chất vải kaki mềm mại, thoáng mát. Màu be trung tính, dễ phối đồ.",
    price: 380000, // 380,000 VND
    image:
      "https://product.hstatic.net/1000300454/product/aqk0013-begi-quan-kaki-nam-owen-regular-fit-kaki-tron_7f93a484f4f049a99b7a4c0196499608_grande.jpg",
    type: "Quần Kaki",
    inStock: true,
    createdAt: new Date("2023-03-05T11:30:00Z"),
    updatedAt: new Date("2023-03-05T11:30:00Z"),
  },
  {
    _id: product5Id,
    name: "Áo Khoác Bomber Nam",
    description:
      "Áo khoác bomber nam chất liệu vải dù nhẹ, chống thấm nước nhẹ. Thiết kế cổ bo, tay bo và gấu áo bo đặc trưng. Phù hợp cho thời tiết se lạnh.",
    price: 550000, // 550,000 VND
    image:
      "https://xstore.8theme.com/elementor2/marseille04/wp-content/uploads/sites/2/2022/12/Image-2.2-min.jpg",
    type: "Áo Khoác",
    inStock: true,
    createdAt: new Date("2023-03-15T14:45:00Z"),
    updatedAt: new Date("2023-03-15T14:45:00Z"),
  },
  {
    _id: product6Id,
    name: "Váy Hoa Nữ Maxi",
    description:
      "Váy maxi nữ họa tiết hoa nhí, chất liệu voan mềm mại, bay bổng. Thiết kế hai dây, eo chun co giãn. Thích hợp đi biển hoặc dạo phố mùa hè.",
    price: 420000, // 420,000 VND
    image:
      "https://down-vn.img.susercontent.com/file/sg-11134201-22100-o6wv6o7l4liv05",
    type: "Váy/Đầm",
    inStock: true,
    createdAt: new Date("2023-03-25T16:20:00Z"),
    updatedAt: new Date("2023-03-25T16:20:00Z"),
  },
  {
    _id: product7Id,
    name: "Áo Hoodie Nỉ Bông",
    description:
      "Áo hoodie unisex chất liệu nỉ bông dày dặn, ấm áp. Có mũ trùm đầu và túi kangaroo phía trước. Phom rộng rãi, thoải mái.",
    price: 390000, // 390,000 VND
    image:
      "https://xstore.b-cdn.net/elementor2/marseille04/wp-content/uploads/sites/2/2022/12/Image-17.2-min.jpg",
    type: "Áo Hoodie",
    inStock: true,
    createdAt: new Date("2023-04-05T13:10:00Z"),
    updatedAt: new Date("2023-04-05T13:10:00Z"),
  },
  {
    _id: product8Id,
    name: "Quần Short Jean Nữ",
    description:
      "Quần short jean nữ cạp cao, tôn dáng. Chất liệu denim bền đẹp, có độ co giãn nhẹ. Thiết kế 5 túi cơ bản, gấu quần tua rua cá tính.",
    price: 280000, // 280,000 VND
    image:
      "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lk2k4lgfl1t4cc",
    type: "Quần Short",
    inStock: true,
    createdAt: new Date("2023-04-15T10:45:00Z"),
    updatedAt: new Date("2023-04-15T10:45:00Z"),
  },
];

// Cart Collection Sample Data
const carts = [
  {
    _id: cart1Id,
    userId: user1Id, // johndoe
    items: [
      {
        productId: product1Id, // Áo Thun Cotton Cơ Bản
        quantity: 2,
        price: 150000,
        name: "Áo Thun Cotton Cơ Bản",
        image:
          "https://salt.tikicdn.com/cache/w1200/ts/product/8b/54/7f/b7a3d8f0e17d74426b0f41f55c11e32c.jpg",
      },
      {
        productId: product4Id, // Quần Kaki Nam Chinos
        quantity: 1,
        price: 380000,
        name: "Quần Kaki Nam Chinos",
        image:
          "https://product.hstatic.net/1000300454/product/aqk0013-begi-quan-kaki-nam-owen-regular-fit-kaki-tron_7f93a484f4f049a99b7a4c0196499608_grande.jpg",
      },
    ],
    totalAmount: 2 * 150000 + 1 * 380000, // 300,000 + 380,000 = 680,000
    createdAt: new Date("2023-06-20T09:30:00Z"),
    updatedAt: new Date("2023-06-20T09:30:00Z"),
  },
  {
    _id: cart2Id,
    userId: user2Id, // janedoe
    items: [
      {
        productId: product6Id, // Váy Hoa Nữ Maxi
        quantity: 1,
        price: 420000,
        name: "Váy Hoa Nữ Maxi",
        image:
          "https://down-vn.img.susercontent.com/file/sg-11134201-22100-o6wv6o7l4liv05",
      },
      {
        productId: product8Id, // Quần Short Jean Nữ
        quantity: 1,
        price: 280000,
        name: "Quần Short Jean Nữ",
        image:
          "https://down-vn.img.susercontent.com/file/vn-11134207-7r98o-lk2k4lgfl1t4cc",
      },
    ],
    totalAmount: 1 * 420000 + 1 * 280000, // 420,000 + 280,000 = 700,000
    createdAt: new Date("2023-06-22T15:45:00Z"),
    updatedAt: new Date("2023-06-22T15:45:00Z"),
  },
];

// Export for reference
export { users, products, carts };

// Example of how to import and use this data with MongoDB
/*
import { MongoClient } from 'mongodb';
import { users, products, carts } from './sample-data.js';

async function importSampleData() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce'; // Use environment variable
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db(); // Get default database from connection string
    
    // Clear existing data
    console.log('Clearing existing data...');
    await db.collection('users').deleteMany({});
    await db.collection('products').deleteMany({});
    await db.collection('carts').deleteMany({});
    
    // Insert sample data
    console.log('Inserting sample data...');
    await db.collection('users').insertMany(users);
    await db.collection('products').insertMany(products);
    await db.collection('carts').insertMany(carts);
    
    console.log('Sample data imported successfully');
  } catch (err) {
      console.error("Error during data import:", err)
  } finally {
    await client.close();
  }
}

importSampleData().catch(console.error);
*/
