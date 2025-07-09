-- Insert foundation shade data for existing products
-- First, let's add shades for Fenty Beauty Pro Filt'r Foundation
INSERT INTO foundation_shades (product_id, shade_name, shade_code, hex_color, rgb_values, undertone, depth_level, is_available)
SELECT 
  fp.id,
  shade_data.shade_name,
  shade_data.shade_code,
  shade_data.hex_color,
  shade_data.rgb_values,
  shade_data.undertone::skin_undertone,
  shade_data.depth_level,
  true
FROM foundation_products fp
JOIN brands b ON fp.brand_id = b.id
CROSS JOIN (
  VALUES 
    ('100 - Fair with neutral undertones', '100', '#F2E4D0', ARRAY[242, 228, 208], 'neutral', 1),
    ('110 - Fair Light with cool undertones', '110', '#F0E2CD', ARRAY[240, 226, 205], 'cool', 2),
    ('120 - Fair Light with warm undertones', '120', '#EFE0CA', ARRAY[239, 224, 202], 'warm', 2),
    ('130 - Light with neutral undertones', '130', '#EBDCC6', ARRAY[235, 220, 198], 'neutral', 3),
    ('140 - Light with warm undertones', '140', '#E8D9C1', ARRAY[232, 217, 193], 'warm', 3),
    ('150 - Light Medium with neutral undertones', '150', '#E4D5BC', ARRAY[228, 213, 188], 'neutral', 4),
    ('160 - Light Medium with warm undertones', '160', '#E0D1B7', ARRAY[224, 209, 183], 'warm', 4),
    ('170 - Light Medium with cool undertones', '170', '#DDD0B5', ARRAY[221, 208, 181], 'cool', 4),
    ('200 - Light Medium with neutral undertones', '200', '#D6C7A8', ARRAY[214, 199, 168], 'neutral', 5),
    ('210 - Light Medium with warm undertones', '210', '#D2C3A4', ARRAY[210, 195, 164], 'warm', 5),
    ('220 - Light Medium with neutral undertones', '220', '#CFC1A2', ARRAY[207, 193, 162], 'neutral', 5),
    ('230 - Medium Light with warm undertones', '230', '#CAB89C', ARRAY[202, 184, 156], 'warm', 6),
    ('240 - Medium Light with neutral undertones', '240', '#C6B498', ARRAY[198, 180, 152], 'neutral', 6),
    ('250 - Medium with neutral undertones', '250', '#C1AF93', ARRAY[193, 175, 147], 'neutral', 7),
    ('260 - Medium with warm undertones', '260', '#BDAB8F', ARRAY[189, 171, 143], 'warm', 7),
    ('280 - Medium with cool undertones', '280', '#B5A387', ARRAY[181, 163, 135], 'cool', 7),
    ('290 - Medium with olive undertones', '290', '#B19F83', ARRAY[177, 159, 131], 'olive', 8),
    ('300 - Medium Deep with neutral undertones', '300', '#AD9B7F', ARRAY[173, 155, 127], 'neutral', 8),
    ('310 - Medium Deep with warm undertones', '310', '#A9977B', ARRAY[169, 151, 123], 'warm', 8),
    ('320 - Medium Deep with neutral undertones', '320', '#A59377', ARRAY[165, 147, 119], 'neutral', 9),
    ('330 - Medium Deep with warm undertones', '330', '#A18F73', ARRAY[161, 143, 115], 'warm', 9),
    ('340 - Medium Deep with cool undertones', '340', '#9D8B6F', ARRAY[157, 139, 111], 'cool', 9),
    ('350 - Medium Deep with neutral undertones', '350', '#99876B', ARRAY[153, 135, 107], 'neutral', 10),
    ('360 - Medium Deep with warm undertones', '360', '#958367', ARRAY[149, 131, 103], 'warm', 10),
    ('370 - Deep with neutral undertones', '370', '#917F63', ARRAY[145, 127, 99], 'neutral', 11),
    ('380 - Deep with warm undertones', '380', '#8D7B5F', ARRAY[141, 123, 95], 'warm', 11),
    ('385 - Deep with cool undertones', '385', '#89775B', ARRAY[137, 119, 91], 'cool', 11),
    ('390 - Deep with neutral undertones', '390', '#857357', ARRAY[133, 115, 87], 'neutral', 12),
    ('400 - Deep with warm undertones', '400', '#816F53', ARRAY[129, 111, 83], 'warm', 12),
    ('410 - Deep with neutral undertones', '410', '#7D6B4F', ARRAY[125, 107, 79], 'neutral', 13),
    ('420 - Deep with warm undertones', '420', '#79674B', ARRAY[121, 103, 75], 'warm', 13),
    ('430 - Deep with cool undertones', '430', '#756347', ARRAY[117, 99, 71], 'cool', 13),
    ('440 - Deep with neutral undertones', '440', '#715F43', ARRAY[113, 95, 67], 'neutral', 14),
    ('445 - Deep with warm undertones', '445', '#6D5B3F', ARRAY[109, 91, 63], 'warm', 14),
    ('450 - Very Deep with neutral undertones', '450', '#69573B', ARRAY[105, 87, 59], 'neutral', 15),
    ('460 - Very Deep with warm undertones', '460', '#655337', ARRAY[101, 83, 55], 'warm', 15),
    ('470 - Very Deep with cool undertones', '470', '#614F33', ARRAY[97, 79, 51], 'cool', 15),
    ('480 - Very Deep with neutral undertones', '480', '#5D4B2F', ARRAY[93, 75, 47], 'neutral', 16),
    ('490 - Very Deep with warm undertones', '490', '#59472B', ARRAY[89, 71, 43], 'warm', 16),
    ('498 - Very Deep with neutral undertones', '498', '#554327', ARRAY[85, 67, 39], 'neutral', 17)
) AS shade_data(shade_name, shade_code, hex_color, rgb_values, undertone, depth_level)
WHERE b.name = 'Fenty Beauty' AND fp.name = 'Pro Filt''r Soft Matte Foundation';

-- Add shades for Charlotte Tilbury Airbrush Flawless Foundation
INSERT INTO foundation_shades (product_id, shade_name, shade_code, hex_color, rgb_values, undertone, depth_level, is_available)
SELECT 
  fp.id,
  shade_data.shade_name,
  shade_data.shade_code,
  shade_data.hex_color,
  shade_data.rgb_values,
  shade_data.undertone::skin_undertone,
  shade_data.depth_level,
  true
FROM foundation_products fp
JOIN brands b ON fp.brand_id = b.id
CROSS JOIN (
  VALUES 
    ('1 Fair', '1', '#F5E6D3', ARRAY[245, 230, 211], 'neutral', 1),
    ('2 Fair', '2', '#F2E3D0', ARRAY[242, 227, 208], 'cool', 2),
    ('3 Fair', '3', '#EFE0CD', ARRAY[239, 224, 205], 'warm', 2),
    ('4 Fair', '4', '#EBDCC8', ARRAY[235, 220, 200], 'neutral', 3),
    ('5 Fair', '5', '#E8D9C5', ARRAY[232, 217, 197], 'warm', 3),
    ('6 Medium', '6', '#E4D5C0', ARRAY[228, 213, 192], 'neutral', 4),
    ('7 Medium', '7', '#E0D1BC', ARRAY[224, 209, 188], 'cool', 4),
    ('8 Medium', '8', '#DDD0B9', ARRAY[221, 208, 185], 'warm', 4),
    ('9 Medium', '9', '#D6C7AA', ARRAY[214, 199, 170], 'neutral', 5),
    ('10 Medium', '10', '#D2C3A6', ARRAY[210, 195, 166], 'warm', 5),
    ('11 Medium', '11', '#CFC1A3', ARRAY[207, 193, 163], 'neutral', 5),
    ('12 Medium', '12', '#CAB89E', ARRAY[202, 184, 158], 'cool', 6),
    ('13 Medium', '13', '#C6B49A', ARRAY[198, 180, 154], 'warm', 6),
    ('14 Medium', '14', '#C1AF95', ARRAY[193, 175, 149], 'neutral', 7),
    ('15 Medium', '15', '#BDAB91', ARRAY[189, 171, 145], 'warm', 7),
    ('16 Medium', '16', '#B5A389', ARRAY[181, 163, 137], 'cool', 7)
) AS shade_data(shade_name, shade_code, hex_color, rgb_values, undertone, depth_level)
WHERE b.name = 'Charlotte Tilbury' AND fp.name = 'Airbrush Flawless Foundation';

-- Add shades for Rare Beauty Liquid Touch Weightless Foundation
INSERT INTO foundation_shades (product_id, shade_name, shade_code, hex_color, rgb_values, undertone, depth_level, is_available)
SELECT 
  fp.id,
  shade_data.shade_name,
  shade_data.shade_code,
  shade_data.hex_color,
  shade_data.rgb_values,
  shade_data.undertone::skin_undertone,
  shade_data.depth_level,
  true
FROM foundation_products fp
JOIN brands b ON fp.brand_id = b.id
CROSS JOIN (
  VALUES 
    ('2W Fair', '2W', '#F4E5D2', ARRAY[244, 229, 210], 'warm', 1),
    ('4N Fair', '4N', '#F1E2CF', ARRAY[241, 226, 207], 'neutral', 2),
    ('6C Fair', '6C', '#EFE0CC', ARRAY[239, 224, 204], 'cool', 2),
    ('8W Light', '8W', '#EBDCC7', ARRAY[235, 220, 199], 'warm', 3),
    ('10N Light', '10N', '#E8D9C4', ARRAY[232, 217, 196], 'neutral', 3),
    ('12C Light', '12C', '#E4D5C0', ARRAY[228, 213, 192], 'cool', 4),
    ('14W Light Medium', '14W', '#E0D1BB', ARRAY[224, 209, 187], 'warm', 4),
    ('16N Light Medium', '16N', '#DDD0B8', ARRAY[221, 208, 184], 'neutral', 4),
    ('18C Light Medium', '18C', '#D9CCB4', ARRAY[217, 204, 180], 'cool', 5),
    ('20W Medium', '20W', '#D5C8B0', ARRAY[213, 200, 176], 'warm', 5),
    ('22N Medium', '22N', '#D1C4AC', ARRAY[209, 196, 172], 'neutral', 5),
    ('24C Medium', '24C', '#CDC0A8', ARRAY[205, 192, 168], 'cool', 6),
    ('26W Medium', '26W', '#C9BCA4', ARRAY[201, 188, 164], 'warm', 6),
    ('28N Medium', '28N', '#C5B8A0', ARRAY[197, 184, 160], 'neutral', 7),
    ('30C Medium Deep', '30C', '#C1B49C', ARRAY[193, 180, 156], 'cool', 7),
    ('32W Medium Deep', '32W', '#BDB098', ARRAY[189, 176, 152], 'warm', 8)
) AS shade_data(shade_name, shade_code, hex_color, rgb_values, undertone, depth_level)
WHERE b.name = 'Rare Beauty' AND fp.name = 'Liquid Touch Weightless Foundation';